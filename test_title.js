const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function buildTitleCache() {
    const BRAIN_ROOT = path.join(process.env.HOME, '.gemini/antigravity-ide/brain');
    const dirs = fs.readdirSync(BRAIN_ROOT, { withFileTypes: true });
    const cache = {};
    for (let dirent of dirs) {
        if (!dirent.isDirectory() || dirent.name === 'scratch' || dirent.name === '.system_generated') continue;
        const transcriptPath = path.join(BRAIN_ROOT, dirent.name, '.system_generated', 'logs', 'transcript.jsonl');
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
                            cache[match[1]] = match[2].trim();
                        }
                    } catch(e) {}
                }
            }
            rl.close();
        }
    }
    return cache;
}

const start = Date.now();
buildTitleCache().then(cache => {
    console.log(cache);
    console.log("Time taken:", Date.now() - start, "ms");
});
