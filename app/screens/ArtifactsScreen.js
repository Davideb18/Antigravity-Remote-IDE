import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

const BACKEND_URL = 'http://192.168.0.169:3000';

export default function ArtifactsScreen() {
  const [activeTab, setActiveTab] = useState('implementation_plan');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtifact(activeTab);
  }, [activeTab]);

  const fetchArtifact = async (name) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/artifacts/${name}`);
      if (res.data.success) {
        setContent(res.data.content);
      } else {
        setContent(`Nessun documento trovato per: ${name}.md`);
      }
    } catch (e) {
      setContent('Errore durante il caricamento del documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'implementation_plan' && styles.activeTab]}
          onPress={() => setActiveTab('implementation_plan')}
        >
          <Text style={styles.tabText}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'task' && styles.activeTab]}
          onPress={() => setActiveTab('task')}
        >
          <Text style={styles.tabText}>Task</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'walkthrough' && styles.activeTab]}
          onPress={() => setActiveTab('walkthrough')}
        >
          <Text style={styles.tabText}>Walkthrough</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}} />
        ) : (
          <Text style={{color: 'white'}}>{content}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const markdownStyles = {
  body: { color: '#ffffff', fontSize: 16 },
  heading1: { color: '#007AFF', marginTop: 10, marginBottom: 10 },
  heading2: { color: '#007AFF', marginTop: 10, marginBottom: 10 },
  link: { color: '#4da6ff' },
  code_block: { backgroundColor: '#2b2b2b', color: '#00ff00', padding: 10, borderRadius: 5 },
  code_inline: { backgroundColor: '#2b2b2b', color: '#ffeb3b', padding: 2, borderRadius: 3 },
  blockquote: { backgroundColor: '#333', borderLeftColor: '#007AFF', borderLeftWidth: 4, padding: 10 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#2b2b2b', padding: 10 },
  tabButton: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#007AFF' },
  tabText: { color: '#fff', fontWeight: 'bold' },
  scrollContainer: { flex: 1, padding: 15 },
});
