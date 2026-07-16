import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import axios from 'axios';
import Markdown from 'react-native-markdown-display'; // Re-enabled markdown

const BACKEND_URL = 'http://192.168.0.169:3000';

export default function MainIDEScreen({ project, conversationId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  
  // Artifact Viewer Modal State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerContent, setViewerContent] = useState('');

  // Extract all currently modified files to show in Header
  const [latestModifiedFiles, setLatestModifiedFiles] = useState([]);

  useEffect(() => {
    // If it's a 'new' conversation, we don't load history
    if (conversationId !== 'new') {
      axios.get(`${BACKEND_URL}/api/chat/${conversationId}`).then(res => {
        if (res.data.success) {
          setMessages(res.data.messages);
          extractHeaderFiles(res.data.messages);
        }
      });
    }

    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    if (conversationId !== 'new') {
      newSocket.emit('join_conversation', conversationId);
    }

    newSocket.on('chat_update', (msgs) => {
      setMessages(msgs);
      extractHeaderFiles(msgs);
    });

    return () => newSocket.disconnect();
  }, [conversationId]);

  const extractHeaderFiles = (msgs) => {
    if (!msgs || msgs.length === 0) return;
    // Get modified files from the most recent agent messages
    let files = [];
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].modifiedFiles) {
        files = msgs[i].modifiedFiles;
        break; // Found the latest block of modified files
      }
    }
    setLatestModifiedFiles(files);
  };

  const openViewer = async (fileName) => {
    setViewerTitle(fileName);
    setViewerContent('Caricamento...');
    setViewerVisible(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/artifacts/${conversationId}/${fileName}`);
      if (res.data.success) {
        setViewerContent(res.data.content);
      } else {
        setViewerContent('Contenuto non trovato.');
      }
    } catch (e) {
      setViewerContent('Errore nel caricamento del file.');
    }
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      alert('Invio...');
      setInputText('');
    }
  };

  const renderArtifacts = (artifacts) => {
    if (!artifacts || artifacts.length === 0) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artifactsScroll}>
        {artifacts.map((art, index) => (
          <TouchableOpacity key={index} style={styles.artifactButton} onPress={() => openViewer(art)}>
            <Ionicons name="document-text" size={16} color="#007AFF" />
            <Text style={styles.artifactText}>{art}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.user._id === 1;
    return (
      <View style={{ marginVertical: 10 }}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
        {/* If agent generated artifacts in this step, show them below the bubble */}
        {!isUser && renderArtifacts(item.artifacts)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER: Antigravity IDE Mockup */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={{paddingRight:10}}>
          <Ionicons name="menu" size={28} color="#888" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{project}</Text>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={20} color="#2ea44f" />
        </TouchableOpacity>
      </View>

      {/* MODIFIED FILES STRIP */}
      {latestModifiedFiles.length > 0 && (
        <View style={styles.changesHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {latestModifiedFiles.map((file, idx) => (
              <TouchableOpacity key={idx} style={styles.changeBadge}>
                <Ionicons name="code-slash" size={14} color="#e3b341" />
                <Text style={styles.changeText}>{file} <Text style={{color:'#2ea44f'}}>+M</Text></Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* MAIN CHAT */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={messages}
          keyExtractor={item => item._id.toString()}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.chatList}
        />

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add" size={24} color="#888" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Chiedi ad Antigravity..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* DOCUMENT VIEWER MODAL */}
      <Modal visible={viewerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{viewerTitle}</Text>
          <TouchableOpacity onPress={() => setViewerVisible(false)}>
            <Text style={{color: '#007AFF', fontWeight: 'bold'}}>Chiudi</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <Text style={{color: '#fff'}}>{viewerContent}</Text>
        </ScrollView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#2b2b2b', borderBottomWidth: 1, borderBottomColor: '#3d3d3d' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  playButton: { padding: 5 },
  changesHeader: { backgroundColor: '#252525', padding: 10, borderBottomWidth: 1, borderBottomColor: '#3d3d3d' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10 },
  changeText: { color: '#ccc', marginLeft: 5, fontSize: 12 },
  chatList: { padding: 15 },
  bubble: { maxWidth: '85%', padding: 15, borderRadius: 12 },
  bubbleUser: { backgroundColor: '#2b2b2b', alignSelf: 'flex-end' },
  bubbleAgent: { backgroundColor: 'transparent', alignSelf: 'flex-start' },
  messageText: { color: '#e0e0e0', fontSize: 16, lineHeight: 22 },
  artifactsScroll: { marginTop: 10, paddingLeft: 10 },
  artifactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2b2b2b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#3d3d3d' },
  artifactText: { color: '#007AFF', marginLeft: 5, fontSize: 14, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#1e1e1e', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#3d3d3d' },
  actionButton: { padding: 10 },
  input: { flex: 1, backgroundColor: '#2b2b2b', color: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, marginHorizontal: 5 },
  sendButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#2b2b2b' },
  modalTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContent: { flex: 1, backgroundColor: '#1e1e1e', padding: 20 }
});
