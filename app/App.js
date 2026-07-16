import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import WelcomeScreen from './screens/WelcomeScreen';
import MainIDEScreen from './screens/MainIDEScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const openIDE = (project, conversation) => {
    setSelectedProject(project);
    setSelectedConversation(conversation);
    setCurrentScreen('ide');
  };

  const goBackToWelcome = () => {
    setCurrentScreen('welcome');
    setSelectedProject(null);
    setSelectedConversation(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'welcome' ? (
        <WelcomeScreen onSelect={openIDE} />
      ) : (
        <MainIDEScreen 
          project={selectedProject} 
          conversationId={selectedConversation} 
          onBack={goBackToWelcome}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' }
});
