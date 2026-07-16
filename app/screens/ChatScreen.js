import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import axios from 'axios';

const BACKEND_URL = 'http://192.168.0.169:3000';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/chat`).then(res => {
      if (res.data.success) setMessages(res.data.messages);
    }).catch(e => console.error(e));

    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('chat_update', (msgs) => {
      setMessages(msgs);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = () => {
    if (inputText.trim()) {
      alert("Invio reale al backend non ancora implementato");
      setInputText('');
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.user._id === 1;
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item._id.toString()}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.chatList}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => alert('Dettatura')}>
          <Ionicons name="mic" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Scrivi ad Antigravity..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  chatList: { padding: 15 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginVertical: 4 },
  bubbleUser: { backgroundColor: '#007AFF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAgent: { backgroundColor: '#2b2b2b', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { color: '#fff', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#2b2b2b', alignItems: 'center' },
  actionButton: { padding: 10 },
  input: { flex: 1, backgroundColor: '#1e1e1e', color: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginHorizontal: 5 },
  sendButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});
