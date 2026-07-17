import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'http://192.168.0.169:3000';

export default function WelcomeScreen({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, convRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/projects`),
          axios.get(`${BACKEND_URL}/api/conversations`)
        ]);
        if (projRes.data.success) setProjects(projRes.data.projects);
        if (convRes.data.success) setConversations(convRes.data.conversations);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <ActivityIndicator style={{marginTop:50}} color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Antigravity Remote IDE</Text>
      
      {!selectedProject ? (
        <>
          <Text style={styles.subtitle}>Seleziona un Progetto Recente</Text>
          <FlatList
            data={projects}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.listItem} onPress={() => setSelectedProject(item)}>
                <Ionicons name="folder" size={24} color="#4da6ff" style={styles.icon} />
                <Text style={styles.listText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedProject(null)}>
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
            <Text style={{color: '#007AFF', marginLeft: 5}}>Cambia Progetto ({selectedProject})</Text>
          </TouchableOpacity>

          <SectionList
            sections={[
              { title: `Chat in ${selectedProject}`, data: conversations.filter(c => c.projectName === selectedProject) },
              { title: 'Altre Chat', data: conversations.filter(c => c.projectName !== selectedProject) }
            ].filter(s => s.data.length > 0)}
            keyExtractor={item => item.id}
            ListHeaderComponent={
              <>
                <Text style={styles.subtitle}>Seleziona o Inizia una Chat</Text>
                <TouchableOpacity style={[styles.listItem, {backgroundColor: '#007AFF'}]} onPress={() => onSelect(selectedProject, 'new')}>
                  <Ionicons name="add-circle" size={24} color="#fff" style={styles.icon} />
                  <Text style={[styles.listText, {color: '#fff', fontWeight: 'bold'}]}>Nuova Conversazione</Text>
                </TouchableOpacity>
              </>
            }
            renderSectionHeader={({section: {title}}) => (
              <Text style={[styles.subtitle, {marginTop: 20, color: '#4da6ff', fontWeight: 'bold'}]}>{title}</Text>
            )}
            renderItem={({item}) => {
              const date = new Date(item.createdAt);
              const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              return (
                <TouchableOpacity style={styles.listItem} onPress={() => onSelect(selectedProject, item.id)}>
                  <Ionicons name="chatbubbles" size={24} color="#888" style={styles.icon} />
                  <View style={{flex: 1}}>
                    <Text style={styles.listText} numberOfLines={1}>{item.title}</Text>
                    <Text style={{color: '#666', fontSize: 12, marginTop: 4}}>
                      {formattedDate} {item.projectName !== selectedProject ? ` • ${item.projectName}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#888', marginBottom: 15 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2b2b2b', padding: 15, borderRadius: 8, marginBottom: 10 },
  listText: { color: '#fff', fontSize: 16 },
  icon: { marginRight: 15 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }
});
