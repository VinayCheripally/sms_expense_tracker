# SmartExpense - Expense Tracker with SMS Detection

A React Native Expo app that automatically detects and categorizes expenses from SMS transactions using a backend service with DeviceEventEmitter communication.

## 🚀 How to Run the App

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For Android: Android Studio or physical Android device
- For iOS: Xcode (macOS only) or physical iOS device

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running the App

#### Option 1: Development Server (Recommended for testing)
```bash
npm run dev
```
This starts the Expo development server. You can then:
- Press `w` to open in web browser
- Press `a` to open Android emulator/device
- Press `i` to open iOS simulator/device
- Scan QR code with Expo Go app on your phone

#### Option 2: Web Development
```bash
npm run dev
# Then press 'w' or visit http://localhost:8081
```

#### Option 3: Android Development
```bash
npm run android
```
Requires Android Studio or connected Android device.

#### Option 4: iOS Development (macOS only)
```bash
npm run ios
```
Requires Xcode and iOS simulator or connected iOS device.

## 📱 Platform-Specific Features

### Web Platform
- ✅ Full UI functionality
- ✅ Authentication and database
- ✅ Manual expense tracking
- ❌ SMS reading (not available on web)
- ❌ Push notifications (limited)

### Android Platform
- ✅ Full functionality
- ✅ SMS reading with backend service
- ✅ Background processing via DeviceEventEmitter
- ✅ Push notifications
- ✅ Real-time transaction detection

### iOS Platform
- ✅ Full UI functionality
- ✅ Authentication and database
- ✅ Push notifications
- ❌ SMS reading (iOS restrictions)

## 🏗️ Architecture

### Backend SMS Service
The app uses a sophisticated backend service architecture:

1. **Native Backend** (`SmsReceiver.kt`) - Handles SMS reception
2. **DeviceEventEmitter** - Communicates between native and React Native
3. **Pattern Matching** - Advanced SMS analysis for spam/transaction detection
4. **Background Processing** - Works even when app is backgrounded

### Key Components
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **SMS Processing**: Enhanced pattern matching with merchant extraction
- **Notifications**: Expo Notifications with background support
- **State Management**: React hooks with Supabase real-time

## 🧪 Testing Features

### Test Buttons Available:
1. **Test Notification** - Verify notification permissions
2. **Test Backend Transaction** - Simulate SMS via DeviceEventEmitter
3. **Test All Patterns** - Test spam/transaction pattern matching
4. **Backend Service Test** - Check background capabilities

### Development Testing:
```bash
# Test the backend SMS simulation
# Go to Add Expense tab and tap "Simulate Backend SMS Transaction"

# Test pattern matching
# Go to Settings and tap "Test All Patterns"
```

## 🔧 Development Build (For Full SMS Features)

For production-ready SMS functionality, create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Create development build
eas build --platform android --profile development
```

## 📋 Environment Setup

### Required Environment Variables:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup:
The app includes Supabase migrations. Run them in your Supabase dashboard:
- Migration: `supabase/migrations/20250613035648_broad_rain.sql`

## 🚨 Troubleshooting

### Common Issues:

1. **SMS not working on web:**
   - Expected behavior - SMS features only work on Android

2. **Backend service not starting:**
   - Ensure you're running on Android
   - Check that DeviceEventEmitter is properly configured

3. **Notifications not showing:**
   - Grant notification permissions in Settings tab
   - Test with "Test Notification" button

4. **Database connection issues:**
   - Verify environment variables are set correctly
   - Check Supabase project configuration

### Development Tips:

- Use web for UI development and testing
- Use Android emulator/device for SMS testing
- Check console logs for detailed debugging info
- Use the built-in test buttons for feature verification

## 📚 Tech Stack

- **Framework**: Expo SDK 52.0.30
- **Navigation**: Expo Router 4.0.17
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Notifications**: Expo Notifications
- **SMS Processing**: Custom backend service with DeviceEventEmitter
- **UI**: React Native with custom styling
- **Icons**: Lucide React Native

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- User-specific data isolation
- Secure SMS pattern matching
- Spam detection and filtering
- Background service with proper cleanup

---

**Note**: For the best experience with SMS features, use a physical Android device or create a development build with EAS.