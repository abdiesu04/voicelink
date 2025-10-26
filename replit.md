# VoiceLink - Real-Time Voice Translation App

## Overview
VoiceLink is a real-time voice translation application that enables two users to have conversations in different languages with instant translation. Built with Azure Speech and Translation services, it provides low-latency, high-quality voice translation using WebSocket connections.

## Purpose
Break language barriers by allowing users to speak naturally in their preferred language while their conversation partner hears real-time translations in theirs.

## Current State
**Phase**: MVP Development - Task 1 (Schema & Frontend) Complete

### Completed Features
- ✅ Data schemas and TypeScript interfaces defined
- ✅ Complete frontend UI implementation:
  - Landing page with hero section and feature cards
  - Room creation interface
  - Room joining interface
  - Active translation interface with dual-panel layout
  - Language selector with 15+ supported languages
  - Connection status indicators
  - Microphone controls
  - Share dialog with copy functionality
- ✅ Design system configured (colors, typography, spacing)
- ✅ Responsive layouts for mobile, tablet, and desktop

### In Progress
- Backend API implementation
- WebSocket server setup
- Azure services integration

### Pending
- Real-time audio capture and streaming
- Azure Speech-to-Text integration
- Azure Translator API integration
- Text-to-Speech audio playback
- End-to-end testing

## Recent Changes
**Date**: 2025-10-26

### Schema & Frontend (Task 1)
- Defined complete data models in `shared/schema.ts`:
  - Room schema with creator/participant languages
  - Translation message schema
  - WebSocket message types for all real-time events
  - 15 supported languages (English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Dutch, Polish, Turkish)

- Installed Microsoft Cognitive Services Speech SDK for client-side audio processing

- Built all React components:
  - `LanguageSelector`: Searchable dropdown with flag icons
  - `ConnectionStatus`: Real-time connection indicator with latency display
  - `TranscriptionPanel`: Dual-display showing original and translated text
  - `Home`: Landing page with hero, features, how-it-works, and CTA sections
  - `CreateRoom`: Room creation with language selection
  - `JoinRoom`: Join existing room with language selection
  - `Room`: Main translation interface with microphone controls and real-time transcription

- Updated storage interface for room management

## Project Architecture

### Tech Stack
**Frontend**:
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components with Tailwind CSS
- WebSocket client for real-time communication
- Web Audio API for microphone access
- Microsoft Cognitive Services Speech SDK

**Backend**:
- Express.js server
- WebSocket server (ws package)
- In-memory storage (MemStorage)
- Azure Speech SDK for server-side processing
- Axios for Azure Translator API calls

**External Services**:
- Azure Speech Services (speech-to-text, text-to-speech)
- Azure Translator API (text translation)

### Key Files
- `shared/schema.ts`: Data models and types
- `client/src/pages/Home.tsx`: Landing page
- `client/src/pages/CreateRoom.tsx`: Room creation
- `client/src/pages/JoinRoom.tsx`: Room joining
- `client/src/pages/Room.tsx`: Active translation interface
- `client/src/components/LanguageSelector.tsx`: Language selection component
- `client/src/components/TranscriptionPanel.tsx`: Message display component
- `server/storage.ts`: Room storage interface
- `server/routes.ts`: API routes (to be implemented)

### Design System
- Primary color: Blue (#3B82F6) for interactive elements
- Font: Inter for all text
- Spacing: Consistent 4px, 8px, 16px units
- Components: Using Shadcn UI with custom theming
- Responsive: Mobile-first design with breakpoints at 768px and 1024px

## User Preferences
None specified yet.

## Environment Variables
Required secrets (already configured):
- `AZURE_SPEECH_KEY`: Azure Speech service API key
- `AZURE_SPEECH_REGION`: eastus
- `AZURE_TRANSLATOR_KEY`: Azure Translator API key
- `AZURE_TRANSLATOR_REGION`: eastus

## Next Steps
1. Implement backend API routes for room creation
2. Set up WebSocket server for real-time communication
3. Integrate Azure Speech-to-Text for voice recognition
4. Integrate Azure Translator for text translation
5. Implement Text-to-Speech for audio playback
6. Connect frontend to backend with error handling
7. Test complete user journey
8. Get architect review
9. Run end-to-end tests
