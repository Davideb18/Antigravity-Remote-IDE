# Antigravity Remote IDE 🚀

Welcome to **Antigravity Remote IDE**, a modern, real-time remote Integrated Development Environment bridge built to seamlessly connect your mobile device with your local workspace.

## 🌟 Features

- **Real-time Synchronization**: Powered by Socket.io, experience instantaneous feedback and terminal outputs.
- **Remote Terminal Access**: Execute shell commands securely on your host machine directly from the mobile app.
- **Live Artifact & Log Viewing**: Seamlessly parse and view generation logs, transcripts, and artifacts.
- **Cross-platform Mobile App**: Built with Expo and React Native for a smooth experience on iOS and Android.

## 🏗️ Architecture

This project is divided into two main components:

1. **Backend Server (`/backend`)**
   - Built with Node.js, Express, and Socket.io.
   - Acts as a local bridge, exposing file system endpoints and spawning shell sessions.
   - Monitors file changes in real-time using `chokidar`.

2. **Mobile App (`/app`)**
   - Built with React Native & Expo.
   - Beautiful, responsive UI to manage projects, view conversations, and interact with the remote terminal.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI

### 1. Start the Backend Bridge
Navigate to the backend directory, install dependencies, and start the server:
```bash
cd backend
npm install
npm run dev
```
*The server will run on port 3000.*

### 2. Launch the Mobile App
Open a new terminal, navigate to the app directory, install dependencies, and start Expo:
```bash
cd app
npm install
npm start
```
*Scan the QR code with the Expo Go app on your phone, or run it on a simulator.*

## 🔒 Security Note
The backend server provides direct shell access to your host machine. Ensure it is only accessible over secure, trusted networks or via secure tunneling.

## 📄 License
This project is licensed under the ISC License.
