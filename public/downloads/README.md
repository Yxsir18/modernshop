# Mobile App Downloads

This directory contains the mobile app installation files.

## Files to Add

After building the mobile app using EAS Build, place the built files here:

- `modernshop-android.apk` - Android APK file for direct installation
- `modernshop-ios.ipa` - iOS IPA file for TestFlight or enterprise distribution

## How to Build the App

1. Navigate to the mobile-app directory:
   ```bash
   cd mobile-app
   ```

2. Install EAS CLI (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

3. Login to your Expo account:
   ```bash
   eas login
   ```

4. Configure the project (first time only):
   ```bash
   eas build:configure
   ```

5. Build Android APK:
   ```bash
   npm run build:apk
   ```

6. Build iOS IPA:
   ```bash
   npm run build:ios
   ```

7. Download the built files from Expo and place them in this directory

## Alternative: Use Expo Go for Development

For testing during development, users can scan the QR code from the Expo Go app instead of downloading the APK/IPA files.

## Hosting

Make sure this directory is served statically by your web server so users can download the files directly.
