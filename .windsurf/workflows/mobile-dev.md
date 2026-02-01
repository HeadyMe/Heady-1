---
description: Run and develop the Heady Mobile App
---
# Mobile App Development Workflow

This workflow helps you start the mobile application development environment using Expo.

1. **Ensure Backend is Running**
   The mobile app requires the backend services to be active.
   *Reference: Run the `startup-full-stack` workflow first if needed.*

2. **Navigate to Mobile App Directory**
   ```powershell
   cd apps/mobile
   ```

3. **Install Mobile Dependencies**
   Ensure all mobile-specific dependencies are installed.
   ```powershell
   // turbo
   pnpm install
   ```

4. **Start Expo Server**
   Start the Expo Metro bundler.
   ```powershell
   npx expo start
   ```

5. **Connect Device**
   - **Android Emulator**: Press `a` in the terminal.
   - **iOS Simulator**: Press `i` in the terminal (macOS only).
   - **Physical Device**: Scan the QR code with the Expo Go app.

6. **Configure Server URL**
   If running on a physical device, update the server URL in the app:
   1. Open the App.
   2. Go to **Settings**.
   3. Tap **Server Address**.
   4. Enter your computer's LAN IP (e.g., `http://192.168.1.X:4100`).

## Common Issues
- **Connection Failed**: Ensure your phone and computer are on the same Wi-Fi network. Check firewall settings.
- **Metro Bundler Error**: Try clearing cache with `npx expo start -c`.
