# Heady Mobile App

This is the mobile companion app for the Heady Systems ecosystem, built with React Native, Expo, and NativeWind.

## Features

- **Dashboard**: Real-time system status monitoring via Socket.io.
- **Activity Log**: View recent system events and alerts.
- **Settings**: Configure notifications, dark mode, and server connection.
- **Visuals**: Modern UI with native animations and Tailwind styling.

## Getting Started

### Prerequisites

- Node.js and npm/pnpm
- Expo Go app on your mobile device (or Android/iOS simulator)

### Installation

1. Install dependencies from the root:
   ```bash
   pnpm install
   ```

2. Navigate to the mobile app directory:
   ```bash
   cd apps/mobile
   ```

### Running the App

Start the Expo development server:

```bash
npx expo start
```

- Scan the QR code with Expo Go (Android/iOS).
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Press `w` to open in Web Browser.

## Configuration

The app connects to the Heady Automation IDE server by default at `http://10.0.2.2:4100` (Android Emulator localhost).
To change the server URL, edit `components/SocketProvider.tsx` or pass it via props.

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 50)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Connectivity**: Socket.io Client
