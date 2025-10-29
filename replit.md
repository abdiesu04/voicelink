# VoiceLink - Real-Time Voice Translation App

## Overview
VoiceLink is a real-time voice translation application designed to break language barriers. It enables two users to engage in conversations in different languages with instant, high-quality translation using Azure Speech and Translation services. The application leverages WebSocket connections for low-latency communication, providing a natural and seamless cross-lingual interaction experience. The project aims to deliver a robust MVP with real-time interim transcription and gender-specific voice selection.

## User Preferences
I prefer clear and concise explanations. I want an iterative development approach, where I can review changes frequently. Please ask for my approval before implementing any major architectural changes or adding new external dependencies. When making code changes, ensure they align with the existing code style and design patterns.

## System Architecture

### UI/UX Decisions
The application features a dark slate background with Indigo/Blue for interactive elements and Cyan for highlights. It uses the Inter font throughout. Components are built with Shadcn UI and Tailwind CSS, adhering to a responsive, mobile-first design. The UI includes:
- A landing page, room creation/joining interfaces with language and voice gender selection.
- An active translation interface with a dual-panel layout, connection status indicators, microphone controls, and a share dialog.
- A `TranscriptionPanel` visually distinguishes interim transcriptions (dashed border, italic) from final translated messages.

### Technical Implementations
- **Frontend**: React with TypeScript, Wouter for routing, TanStack Query for data fetching, WebSocket client, Web Audio API, and Microsoft Cognitive Services Speech SDK.
- **Backend**: Express.js server, WebSocket server (using `ws` package), and in-memory storage for room management.
- **Real-Time Transcription**: A hybrid system uses Azure Speech SDK's `recognizing` events for throttled (300ms) interim visual feedback (without translation) and `recognized` events for final translation and Text-to-Speech (TTS). This optimizes API costs and user experience.
- **Voice Selection**: Users select a preferred voice gender (male/female) during room creation/joining. This preference is stored, propagated via WebSockets, and used to select gender-specific Azure Neural Voices for TTS (30 voices across 15 languages).
- **Audio Overlap Prevention**: Implemented a queue-based TTS system that ensures only one voice plays at a time. All translations are added to a FIFO queue and processed sequentially. The queue uses time-based estimation to wait for audio playback completion: it calculates playback duration based on word count (150 words per minute) plus a 500ms buffer. This approach is more reliable than event-based detection which was found to be unreliable in browser environments. Messages are only marked as "spoken" after the estimated playback duration completes. The system uses `isProcessingTTSRef` to prevent concurrent queue processing and ensures clean cleanup on component unmount.
- **WebSocket Keepalive**: Implemented ping/pong mechanism (30-second intervals) to prevent idle connection timeouts and ensure stable long-duration conversations.

### Feature Specifications
- **Core Functionality**: Real-time voice translation between two users speaking different languages.
- **Room Management**: Creation and retrieval of rooms with language and voice gender preferences.
- **Real-time Communication**: WebSocket server for instant message exchange, interim transcriptions, and final translations.
- **Microphone Control**: Mute/unmute functionality.
- **Language Support**: 15+ supported languages with corresponding flag icons.
- **Voice Customization**: User-selectable male/female voice gender for TTS output, leveraging Azure Neural voices.

## External Dependencies

- **Azure Speech Services**: Used for Speech-to-Text (STT) transcription and Text-to-Speech (TTS) synthesis, including gender-specific Neural voices.
- **Azure Translator API**: Utilized for text translation between spoken languages.
- **Microsoft Cognitive Services Speech SDK**: Integrated on both client and server for interacting with Azure Speech Services.
- **Axios**: Used for making HTTP requests to external APIs, specifically the Azure Translator API.