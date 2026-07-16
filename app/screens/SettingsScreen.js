import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import axios from 'axios';

const BACKEND_URL = 'http://192.168.0.169:3000';

export default function SettingsScreen() {
  const [model, setModel] = useState('gemini-3.1-pro');
  const [pushing, setPushing] = useState(false);

  const executeCommand = async (command, successMessage) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/command`, { command });
      if (res.data.success) {
        Alert.alert('Successo', successMessage || 'Comando eseguito con successo!');
      } else {
        Alert.alert('Errore', res.data.output);
      }
    } catch (e) {
      Alert.alert('Errore', 'Connessione al backend fallita.');
    }
  };

  const handleGitPush = async () => {
    setPushing(true);
    await executeCommand('git add . && git commit -m "Auto-commit from Antigravity Companion" && git push', 'Push completato su GitHub!');
    setPushing(false);
  };

  const handleAcceptPlan = () => {
    // In futuro: scriverà un messaggio speciale per Antigravity
    Alert.alert('Approvato', 'Hai approvato le modifiche. Antigravity procederà con l\'esecuzione!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Azioni Rapide (Quick Actions)</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleAcceptPlan}>
          <Text style={styles.actionButtonText}>✅ Approva Modifiche / Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#2ea44f'}]} onPress={handleGitPush} disabled={pushing}>
          <Text style={styles.actionButtonText}>{pushing ? 'Pushing...' : '🚀 Git Push to GitHub'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#d73a49'}]}>
          <Text style={styles.actionButtonText}>🛑 Ferma Esecuzione Antigravity</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impostazioni AI</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Modello Attuale:</Text>
          <Text style={styles.settingValue}>{model === 'gemini-3.1-pro' ? 'Gemini 3.1 Pro (High)' : 'Altro'}</Text>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('WIP', 'La selezione del modello modificherà la config locale dell\'IDE nel prossimo aggiornamento.')}>
          <Text style={styles.secondaryButtonText}>Cambia Modello AI</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Usa Prompt Specifici</Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Estensioni Abilitate</Text>
          <Switch value={true} onValueChange={() => {}} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', padding: 15 },
  section: { backgroundColor: '#2b2b2b', padding: 15, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { color: '#007AFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  actionButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#3d3d3d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  secondaryButtonText: { color: '#fff', fontSize: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  settingLabel: { color: '#fff', fontSize: 16 },
  settingValue: { color: '#888', fontSize: 16 },
});
