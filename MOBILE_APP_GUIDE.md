# Heady Mobile App Guide

A feature-rich, high-performance mobile application for the Heady Systems ecosystem, built with React Native, Expo, and NativeWind.

## 📱 Features

### 🚀 Dashboard
- **Real-time Metrics**: Live CPU, Memory, and System Uptime monitoring via Socket.io.
- **Visuals**: Beautiful gradients and smooth entry animations using `react-native-reanimated`.
- **Quick Actions**: One-tap deployment and system controls.

### 🌐 Node Management
- **Service Health**: Live status tracking of all connected services (Primary Core, Worker Nodes, Database).
- **Performance Stats**: View response times and error rates for each node.
- **Visual Indicators**: Color-coded status indicators (Healthy, Degraded, Offline).

### 🔔 Activity & Alerts
- **Live Feed**: Real-time log of system events and alerts.
- **Severity Coding**: Clear distinction between Info, Warning, and Critical alerts.
- **Resolution Status**: Track resolved vs. active issues.

### ⚙️ Task Management
- **Task Tracking**: Monitor running, pending, and completed tasks.
- **Progress Bars**: Live visual progress for active operations.
- **Priority Badges**: Clear visibility of task priority levels.

### 🔧 Settings & Configuration
- **Dynamic Connection**: Configurable Server URL to connect to any Heady Automation instance.
- **Preferences**: Toggle notifications, dark mode, and security settings.

## 🛠️ Technical Stack

- **Framework**: Expo (SDK 50) + React Native
- **Navigation**: Expo Router (File-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native
- **Connectivity**: Socket.io Client + React Context
- **State Management**: React Hooks + Context API
- **Storage**: Async Storage for persistent settings

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start the Development Server**
   ```bash
   cd apps/mobile
   npx expo start
   ```

3. **Run on Device/Simulator**
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator
   - Scan QR code with Expo Go app on physical device

## 🔌 Connection Setup

By default, the app connects to `http://10.0.2.2:4100` (Android Emulator localhost).
To connect to a local server from:
- **iOS Simulator**: Use `http://localhost:4100`
- **Physical Device**: Use your computer's LAN IP (e.g., `http://192.168.1.5:4100`)

Go to **Settings > Server Address** in the app to configure this.
