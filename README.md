# Smart Health Reminder

A mobile app to help users, especially elderly individuals, stay consistent with medication and hydration routines through timely reminders and simple confirmations.

## Core Goals
- Improve medication adherence
- Encourage regular hydration
- Reduce missed doses with fallback reminders
- Provide caregiver visibility for safety

## Planned Features
- Medication schedule setup (daily/weekly, time-based)
- Dose confirmation and adherence tracking
- Medication stock tracking with refill reminders
- Hydration reminders with daily goal tracking
- Multi-channel reminder delivery:
  - Push notifications
  - SMS
  - WhatsApp
  - Voice calls (elderly-friendly fallback)
- Family/caregiver alerts for repeated misses

## Tech Stack (Planned)
- Frontend: React Native (Expo)
- Backend: FastAPI or Node.js
- Database: MongoDB
- Notifications: Firebase, Twilio, WhatsApp Business API

## Current Status
This repository is currently initialized as an Expo app and is being developed using a spec-driven architecture approach.

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Expo Go app on Android/iOS (or emulator/simulator)

### Install
```bash
npm install
```

### Run
```bash
npx expo start
```

Then scan the QR code in Expo Go, or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

## Safety Notice
This app is an assistive reminder system, not a medical authority. Users should always consult healthcare professionals for medical decisions.
