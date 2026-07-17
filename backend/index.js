const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const multer = require('multer');
const { spawn, exec } = require('child_process');
const chokidar = require('chokidar');

let titleCache = {};
let lastCacheUpdate = 0;

async function buildTitleCache(brainRoot) {
    const now = Date.now();
    if (now - lastCacheUpdate < 60000 && Object.keys(titleCache).length > 0) return titleCache;
    try {
        const dirs = fs.readdirSync(brainRoot, { withFileTypes: true });
        for (let dirent of dirs) {
            if (!dirent.isDirectory() || dirent.name === 'scratch' || dirent.name === '.system_generated') continue;
            const transcriptPath = path.join(brainRoot, dirent.name, '.system_generated', 'logs', 'transcript.jsonl');
            if (fs.existsSync(transcriptPath)) {
                const fileStream = fs.createReadStream(transcriptPath);
                const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
                let lineCount = 0;
                for await (const line of rl) {
                    lineCount++;
                    if (lineCount > 100) break;
                    if (line.includes('"type":"CONVERSATION_HISTORY"')) {
                        try {
                            const parsed = JSON.parse(line);
                            const content = parsed.content || "";
                            const regex = /## Conversation ([a-z0-9\-]+): (.*)/g;
                            let match;
                            while ((match = regex.exec(content)) !== null) {
                                titleCache[match[1]] = match[2].trim();
                            }
                        } catch(e) {}
                    }
                }
                rl.close();
            }
        }
        lastCacheUpdate = now;
    } catch (e) {}
    return titleCache;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const PORT = 3000;
const BRAIN_ROOT = path.join(process.env.HOME, '.gemini/antigravity-ide/brain');
const WORKSPACE_ROOT = path.join(process.env.HOME, 'Desktop/Personal_project');

// Serve artifacts
app.use('/artifacts', express.static(BRAIN_ROOT));

// ---------------------------------------------------------
// 1. PROJECTS & CONVERSATIONS LOBBY
// ---------------------------------------------------------
app.get('/api/projects', (req, res) => {
    try {
        const dirs = fs.readdirSync(WORKSPACE_ROOT, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        res.json({ success: true, projects: dirs });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/conversations', async (req, res) => {
    try {
        if (!fs.existsSync(BRAIN_ROOT)) return res.json({ success: true, conversations: [] });
        
        await buildTitleCache(BRAIN_ROOT);
        
        let dirs = fs.readdirSync(BRAIN_ROOT, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name !== 'scratch')
            .map(dirent => {
                const stat = fs.statSync(path.join(BRAIN_ROOT, dirent.name));
                return { name: dirent.name, mtime: stat.mtimeMs };
            });
            
        // Sort by folder modified time descending
        dirs.sort((a, b) => b.mtime - a.mtime);
        
        // Take only top 15 to avoid heavy synchronous parsing
        dirs = dirs.slice(0, 15);
            
        const convs = [];
        for (let dirent of dirs) {
            const convId = dirent.name;
            const transcriptPath = path.join(BRAIN_ROOT, convId, '.system_generated', 'logs', 'transcript.jsonl');
            let title = titleCache[convId] || null;
            let createdAt = null;
            let projectName = "Sconosciuto";
            
            if (fs.existsSync(transcriptPath)) {
                try {
                    // Solo leggiamo le prime righe per essere veloci
                    const fileStream = fs.createReadStream(transcriptPath);
                    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
                    
                    for await (const line of rl) {
                        if (!line.trim()) continue;
                        try {
                            const parsed = JSON.parse(line);
                            if (!createdAt && parsed.created_at) createdAt = parsed.created_at;
                            if (parsed.type === 'USER_INPUT' && parsed.content) {
                                // Extract project name
                                const projMatch = parsed.content.match(/\/Personal_project\/([^/\n"']+)/);
                                if (projMatch && projectName === "Sconosciuto") {
                                    let extracted = projMatch[1];
                                    if (extracted.includes(' -> ')) extracted = extracted.split(' -> ')[0].trim();
                                    projectName = extracted;
                                }
                                
                                // Extract title
                                if (!title) {
                                    const match = parsed.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
                                    if (match && match[1]) {
                                        let rawText = match[1].replace(/<[^>]*>?/gm, '').trim().replace(/\n/g, ' ');
                                        title = rawText.substring(0, 50);
                                        if (rawText.length > 50) title += '...';
                                    }
                                }
                            }
                            if (title && projectName !== "Sconosciuto") break;
                        } catch(e) {}
                    }
                    rl.close();
                } catch(e) {}
            }
            if (!title) title = `Sessione ${convId.substring(0, 8)}`;
            convs.push({ id: convId, title, projectName, createdAt: createdAt || new Date(dirent.mtime).toISOString() });
        }
        
        res.json({ success: true, conversations: convs });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ---------------------------------------------------------
// 2. CHAT & ARTIFACTS PARSING
// ---------------------------------------------------------
async function getChatMessages(conversationId) {
    const transcriptPath = path.join(BRAIN_ROOT, conversationId, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(transcriptPath)) return [];
    
    const messages = [];
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'USER_INPUT' || parsed.type === 'PLANNER_RESPONSE') {
                
                // Parse Artifacts or Modified Files from tool_calls
                const artifacts = [];
                const modifiedFiles = [];
                if (parsed.tool_calls) {
                    parsed.tool_calls.forEach(call => {
                        if (call.name === 'write_to_file' || call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') {
                            const args = JSON.parse(call.arguments);
                            const target = args.TargetFile;
                            if (target && target.includes('.gemini/antigravity-ide/brain/')) {
                                artifacts.push(path.basename(target));
                            } else if (target) {
                                modifiedFiles.push(path.basename(target));
                            }
                        }
                    });
                }

                messages.push({
                    _id: parsed.step_index,
                    text: parsed.content || '[Generazione in corso...]',
                    createdAt: new Date(), 
                    user: {
                        _id: parsed.type === 'USER_INPUT' ? 1 : 2,
                        name: parsed.type === 'USER_INPUT' ? 'Davide' : 'Antigravity',
                    },
                    artifacts: artifacts.length > 0 ? artifacts : null,
                    modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : null
                });
            }
        } catch (e) {}
    }
    return messages.reverse();
}

app.get('/api/chat/:conversationId', async (req, res) => {
    const messages = await getChatMessages(req.params.conversationId);
    res.json({ success: true, messages });
});

// File watcher map
const watchers = {};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let shellProcess = null;
    let currentConversationId = null;

    socket.on('join_conversation', (conversationId) => {
        currentConversationId = conversationId;
        const transcriptPath = path.join(BRAIN_ROOT, conversationId, '.system_generated', 'logs', 'transcript.jsonl');
        
        if (watchers[conversationId]) {
            watchers[conversationId].close();
        }

        if (fs.existsSync(transcriptPath)) {
            watchers[conversationId] = chokidar.watch(transcriptPath).on('change', async () => {
                const messages = await getChatMessages(conversationId);
                socket.emit('chat_update', messages);
            });
        }
    });

    socket.on('start_terminal', (projectDir) => {
        if (shellProcess) return;
        const cwd = path.join(WORKSPACE_ROOT, projectDir || '');
        shellProcess = spawn('bash', [], { cwd });
        
        shellProcess.stdout.on('data', (data) => socket.emit('terminal_output', data.toString()));
        shellProcess.stderr.on('data', (data) => socket.emit('terminal_output', data.toString()));
        
        shellProcess.on('close', () => {
            socket.emit('terminal_output', '\n[Processo Terminato]\n');
            shellProcess = null;
        });
    });

    socket.on('terminal_input', (input) => {
        if (shellProcess) {
            shellProcess.stdin.write(input + '\n');
        }
    });

    socket.on('disconnect', () => {
        if (shellProcess) shellProcess.kill();
        if (currentConversationId && watchers[currentConversationId]) {
            watchers[currentConversationId].close();
        }
        console.log('Client disconnected');
    });
});

app.get('/api/artifacts/:conversationId/:name', (req, res) => {
    const artifactPath = path.join(BRAIN_ROOT, req.params.conversationId, `${req.params.name}`);
    if (fs.existsSync(artifactPath)) {
        res.json({ success: true, content: fs.readFileSync(artifactPath, 'utf8') });
    } else {
        res.status(404).json({ success: false, message: 'Artifact non trovato.' });
    }
});

server.listen(PORT, () => {
    console.log(`IDE Bridge Server running on http://localhost:${PORT}`);
});
