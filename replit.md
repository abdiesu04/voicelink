# Voztra - Real-Time Voice Translation App

## Overview
Voztra is a real-time voice translation application enabling seamless, instant, and high-quality voice translation between two users speaking different languages. It supports over 97 languages, preserving tone, emotion, and gender through advanced voice synthesis. The application aims to eliminate language barriers in real-time conversations, leveraging WebSockets for low-latency communication.

## User Preferences
I prefer clear and concise explanations. I want an iterative development approach, where I can review changes frequently. Please ask for my approval before implementing any major architectural changes or adding new external dependencies. When making code changes, ensure they align with the existing code style and design patterns.

## System Architecture

### UI/UX Decisions
The application features a modern, responsive UI with full light/dark theme support (defaulting to dark), built with Shadcn UI and Tailwind CSS. Key UI elements include:
- A professional Voztra logo.
- Landing, room creation/joining, and active translation interfaces.
- A `TranscriptionPanel` for distinguishing interim and final translations.
- An alternative business-focused landing page (`/voice-translator`).
- Header navigation with Pricing and Account links, and a minutes badge.
- A comprehensive footer with legal and contact links.
- A Pricing page detailing Free, Starter, and Pro subscription tiers.
- An Account/Billing page for subscription management and credit display.
- An Upgrade Modal for credit exhaustion.
- A robust Payment Success Page with intelligent status updates and auto-redirect.
- Full mobile optimization across all pages, including fluid typography, responsive grids, and a mobile-only sticky bottom toolbar with context-aware controls.

### Technical Implementations
- **Frontend**: React with TypeScript, Wouter, TanStack Query, WebSocket client, Web Audio API, and Microsoft Cognitive Services Speech SDK.
- **Backend**: Express.js server with a WebSocket server (`ws` package) for real-time communication.
- **Real-Time Transcription**: Hybrid system using Azure Speech SDK for interim feedback and final translation/TTS.
- **Voice Selection**: Users select gender for TTS, utilizing Azure Premium Multilingual Neural Voices.
- **Audio Management**: Queue-based TTS system prevents audio overlap. Comprehensive mobile audio compatibility includes single Audio element reuse and audio unlocking.
- **Message Deduplication**: Three-layer system prevents duplicate audio playback.
- **WebSocket Stability**: Dual-layer aggressive keepalive, professional disconnect handling, and seamless auto-reconnect system ensure connection reliability.
- **Quota Handling**: Comprehensive Azure quota error detection and graceful degradation prevent service interruptions.
- **Stripe Integration**: Production-ready subscription billing with Stripe Checkout and Customer Portal, supported by webhook handlers for lifecycle events.
- **100% Activation Guarantee System**: Triple-layer subscription activation (immediate frontend confirmation, fast polling, safety net reconciliation worker) ensures ultra-fast credit delivery.
- **Credit Management**: Real-time credit tracking via WebSocket, automatic deduction, hard enforcement at zero credits, and warning toasts.
- **Email Verification**: Production-grade 2-step registration with security-hardened 6-digit code verification via Resend API, ensuring all authenticated users have verified emails.
- **Authentication**: Email/password authentication with bcrypt hashing and Google OAuth integration (auto-linking existing accounts, auto-verification for OAuth users).

### Feature Specifications
- Real-time voice translation between two users.
- Room creation and retrieval with language and voice gender preferences.
- WebSocket server for instant message exchange and transcription.
- Microphone mute/unmute functionality.
- Support for 47 languages with flag icons.
- User-selectable male/female voice gender for TTS.
- Comprehensive Azure API request tracking.

### Subscription System
Voztra uses a three-tier credit-based subscription model:
- **Free Tier**: 60 minutes lifetime allocation.
- **Starter Plan**: $9.99/month for 350 minutes.
- **Pro Plan**: $29.99/month for 1200 minutes with priority support.
Credits are tracked in seconds, deducted in real-time, and hard-enforced at zero, triggering an upgrade modal. Stripe webhooks manage subscription lifecycle events (payment, renewals, plan changes, cancellations).

## External Dependencies

- **Azure Speech Services**: For Speech-to-Text (STT) and Text-to-Speech (TTS).
- **Azure Translator API**: For text translation.
- **Microsoft Cognitive Services Speech SDK**: Client and server interaction with Azure Speech Services.
- **Resend**: For transactional email sending (verification, password resets).
- **Google OAuth 2.0**: For "Continue with Google" authentication.
- **Passport.js**: Authentication middleware, specifically `passport-google-oauth20`.
- **Axios**: For making HTTP requests.