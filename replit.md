# Voztra - Real-Time Voice Translation App

## Overview
Voztra is a real-time voice translation application designed to eliminate language barriers. It enables two users to converse in different languages with instant, high-quality translation using Azure Speech and Translation services. The application leverages WebSocket connections for low-latency communication, providing a natural and seamless cross-lingual interaction experience. It supports 97+ languages, translating voice with preserved tone, emotion, and gender.

## User Preferences
I prefer clear and concise explanations. I want an iterative development approach, where I can review changes frequently. Please ask for my approval before implementing any major architectural changes or adding new external dependencies. When making code changes, ensure they align with the existing code style and design patterns.

## System Architecture

### UI/UX Decisions
The application features a clean, modern design with full light/dark theme support, defaulting to dark mode. It uses a color scheme of Indigo/Blue for interactive elements and Violet/Purple for highlights, with the Inter font. Components are built with Shadcn UI and Tailwind CSS, adhering to a responsive, mobile-first design. The UI includes:
- **Branding**: Professional Voztra logo with chat bubble "O" design displayed as PNG image in navigation header and on login/registration forms. The logo uses transparent background and works well on both light and dark themes. Component located at `client/src/components/VoztraLogo.tsx`, image asset at `attached_assets/a-clean-modern-logo-design-featuring-the_U7fgc6INSwC-QPiP-z7mDQ_KE33-hesSouMk1bakN-xUw-removebg-preview (1)_1762877940367.png`.
- A landing page, room creation/joining interfaces with language and voice gender selection.
- An active translation interface with a dual-panel layout, connection status indicators, microphone controls, and a share dialog.
- A `TranscriptionPanel` visually distinguishes interim transcriptions (dashed border, italic) from final translated messages.
- **Header Navigation**: Minimal navigation showing only Account link for authenticated users. Users click the logo to return home. Pricing page is intentionally hidden from navigation.
- **Footer Navigation**: Displays Privacy Policy and California Privacy Policy links for all users, with Contact Us link visible only for authenticated users.

### Technical Implementations
- **Frontend**: React with TypeScript, Wouter for routing, TanStack Query for data fetching, WebSocket client, Web Audio API, and Microsoft Cognitive Services Speech SDK.
- **Backend**: Express.js server, WebSocket server (using `ws` package), and in-memory storage for room management.
- **Production Session Management**: Express is configured to trust Replit's proxy for secure session cookies.
- **Real-Time Transcription**: A hybrid system uses Azure Speech SDK for throttled interim visual feedback and final translation/Text-to-Speech (TTS).
- **Voice Selection**: Users select gender (male/female) for TTS, utilizing Azure Premium Multilingual Neural Voices (AndrewMultilingualNeural/AvaMultilingualNeural) that support 47 languages with natural accent and tone preservation.
- **Audio Overlap Prevention**: A queue-based TTS system using Azure REST API and HTML5 Audio ensures sequential playback, preventing audio overlap. It includes SSML XML escaping, a retry mechanism, and a synchronous boolean flag for race condition prevention.
- **Mobile Audio Fix**: Comprehensive mobile audio compatibility is implemented through single Audio element reuse, audio unlocking, blob URL management, and a smart timeout fallback for unreliable 'ended' events on mobile browsers.
- **Message Deduplication**: A three-layer deduplication system (server-side broadcast tracking, client-side atomic deduplication, TTS queue deduplication) prevents duplicate audio playback.
- **WebSocket Keepalive & Monitoring**: A dual-layer aggressive keepalive system (application-level heartbeat and protocol-level ping/pong) is implemented to prevent idle timeouts. Professional disconnect handling logs all scenarios and provides clear, context-aware UI messages.
- **Seamless Auto-Reconnect System**: Production-grade automatic reconnection handles random WebSocket disconnects with silent reconnection, state preservation, Azure Speech continuity, and minimal UI feedback. It distinguishes intentional from unintentional disconnects.
- **Professional Quota Handling**: Comprehensive Azure quota error detection and graceful degradation prevent infinite retry loops. It includes intelligent error detection, immediate retry prevention, clear user communication, graceful degradation (text translations still work), UI state management, and TTS queue protection.

### Feature Specifications
- **Core Functionality**: Real-time voice translation between two users.
- **Room Management**: Creation and retrieval of rooms with language and voice gender preferences.
- **Real-time Communication**: WebSocket server for instant message exchange, interim transcriptions, and final translations.
- **Microphone Control**: Mute/unmute functionality.
- **Language Support**: 47 supported languages with flag icons.
- **Voice Customization**: User-selectable male/female voice gender for TTS output using Azure Premium Multilingual Neural Voices.
- **Request Monitoring**: Comprehensive Azure API request tracking with logs, token caching, and session cleanup.

## External Dependencies

- **Azure Speech Services**: Used for Speech-to-Text (STT) transcription and Text-to-Speech (TTS) synthesis, including gender-specific Neural voices.
- **Azure Translator API**: Utilized for text translation between spoken languages.
- **Microsoft Cognitive Services Speech SDK**: Integrated on both client and server for interacting with Azure Speech Services.
- **Axios**: Used for making HTTP requests to external APIs.