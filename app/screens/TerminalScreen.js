import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

const BACKEND_URL = 'http://192.168.0.169:3000';

export default function TerminalScreen() {
  const [output, setOutput] = useState('');
  const [command, setCommand] = useState('');
  const [socket, setSocket] = useState(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.emit('start_terminal');

    newSocket.on('terminal_output', (data) => {
      setOutput((prev) => prev + data);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendCommand = () => {
    if (socket && command.trim()) {
      socket.emit('terminal_input', command);
      setCommand('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.terminalContainer} 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        <Text style={styles.terminalText}>{output}</Text>
      </ScrollView>

      <View style={styles.inputContainer}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          onSubmitEditing={sendCommand}
          placeholder="Esegui comando..."
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendCommand}>
          <Text style={styles.sendButtonText}>Invia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  terminalContainer: { flex: 1, padding: 10 },
  terminalText: { color: '#00ff00', fontFamily: 'Courier', fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 10 },
  prompt: { color: '#00ff00', fontFamily: 'Courier', fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: '#fff', fontFamily: 'Courier', fontSize: 16 },
  sendButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});
