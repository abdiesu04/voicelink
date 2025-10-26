# Voice Translation App - Design Guidelines

## Design Approach

**Selected Approach**: Design System-Based with Communication Tool Inspiration

Drawing from modern communication platforms like Discord, Zoom, and Linear, this design prioritizes clarity, real-time feedback, and minimal cognitive load during active conversations. The interface must feel professional yet approachable, with instant visual feedback for all translation states.

**Core Principles**:
- Immediate clarity: Users should instantly understand connection state and active speaker
- Focused communication: Minimize visual noise during active translation
- Trust and reliability: Professional design that instills confidence in real-time translation
- Accessibility: Clear visual and auditory feedback for all states

---

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts) - for UI elements, labels, and controls
- Secondary: System font stack for real-time transcription displays (performance)

**Hierarchy**:
- Hero/Landing Headlines: text-4xl to text-6xl, font-bold
- Page Titles: text-3xl, font-semibold
- Section Headers: text-xl, font-semibold
- Body Text: text-base, font-normal
- UI Labels: text-sm, font-medium
- Real-time Transcription: text-lg, font-normal (high readability)
- Status Indicators: text-xs to text-sm, font-medium, uppercase tracking-wide

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16** for consistent rhythm
- Component padding: p-4, p-8
- Section spacing: space-y-8, space-y-12
- Element margins: m-2, m-4
- Grid gaps: gap-4, gap-8

**Container Strategy**:
- Landing page: max-w-7xl mx-auto
- App interface: Full viewport with sidebar (if needed) or centered max-w-5xl
- Room interface: Full-screen experience with minimal chrome
- Form containers: max-w-md for focused input

---

## Component Library

### Landing Page Components

**Hero Section** (60-70vh):
- Large centered headline explaining the value proposition
- Subheadline describing key benefit (speak any language, real-time translation)
- Primary CTA: "Create Room" button (large, prominent)
- Secondary CTA: "Learn How It Works" (ghost/outline style)
- Visual: Abstract illustration showing two people with speech bubbles containing different languages (use placeholder image)
- No background video/animation - static, professional

**Features Grid** (3 columns on desktop, 1 on mobile):
- Icon + Title + Description cards for:
  - Real-Time Translation (Heroicons: language icon)
  - Low Latency Communication (Heroicons: bolt icon)
  - Secure Rooms (Heroicons: lock-closed icon)
  - Easy Sharing (Heroicons: link icon)
- Cards with subtle borders, generous padding (p-8)

**How It Works Section**:
- 3-step visual flow (horizontal on desktop, vertical on mobile)
- Step 1: Create room & select language
- Step 2: Share link with conversation partner
- Step 3: Start speaking, hear translation
- Use numbered circles with connecting lines between steps

**Supported Languages Section**:
- Grid display of flag icons or language names
- 4-6 columns on desktop, 2-3 on mobile
- Shows breadth of Azure translation support

**CTA Section** (py-20):
- Centered heading: "Ready to break language barriers?"
- Primary action button
- Trust indicator: "Powered by Azure AI Services" with logo

**Footer**:
- Simple single-row layout
- Links: About, Privacy, Terms, Contact
- Social links if applicable
- Copyright notice

### Application Interface Components

**Pre-Room Interface** (Room Creation/Join):

Create Room View:
- Centered card (max-w-md) with generous padding (p-8)
- Clear heading: "Create Translation Room"
- Language selector (dropdown with flag icons, searchable)
- Large "Create Room" button
- Below card: Small text explaining how it works

Join Room View:
- Similar centered card layout
- Display room ID prominently (large text, monospace font)
- Language selector for joining user
- "Join Conversation" button
- Connection status indicator below button

Room Link Sharing Modal:
- Overlay modal with backdrop blur
- Room link displayed in copyable input field
- Large "Copy Link" button
- QR code for easy mobile sharing (placeholder)
- "Start Conversation" button to proceed

**Active Translation Interface** (Full Screen):

Layout: Single-page full-viewport layout with these zones:

Top Bar (h-16, fixed):
- Left: Room status indicator (dot + "Connected" text)
- Center: Active language pair display "English ↔ Spanish"
- Right: Settings icon, End call button

Main Translation Display (flex-1):
- Two-panel horizontal split (50/50) on desktop, stacked on mobile
- Left Panel: "You" section
  - Speaking indicator (animated pulse when active)
  - Real-time transcription of your speech (scrollable, latest at bottom)
  - Translation of what you said (in partner's language, lighter treatment)
- Right Panel: "Partner" section  
  - Mirror layout of left panel
  - Shows partner's transcription and translation

Visual Treatment:
- Speaking panels get subtle glow/border treatment when active
- Transcription appears with fade-in animation
- Scrollable transcript areas with subtle scrollbar

Bottom Control Bar (h-20, fixed):
- Center-aligned controls:
  - Microphone toggle (large circular button, visual on/off state)
  - Speaker volume control (icon + slider on hover)
  - End conversation button (subtle, outline style)

Status Indicators:
- Connection quality indicator (dot: green/yellow/red with latency ms)
- Translation status ("Listening...", "Translating...", "Speaking...")
- Microphone permission status if needed

**Settings Panel** (Slide-in from right):
- Language selection for both participants
- Audio input/output device selection
- Voice settings (speech rate, pitch if applicable)
- Audio quality toggle
- Close button

### Form Elements

**Language Selector**:
- Custom dropdown with search capability
- Each option shows flag icon + language name
- Selected language prominently displayed
- Dropdown menu with max-h-60, scrollable

**Input Fields**:
- Consistent height (h-12)
- Padding: px-4
- Border treatment with focus states
- Labels positioned above (text-sm, font-medium)

**Buttons**:
Primary: Large padding (px-8 py-4), rounded-lg, font-semibold
Secondary: Similar size, outline style with transparent background
Icon buttons: Square (h-12 w-12), rounded-full for microphone toggle
Destructive (End call): Outline style with warning treatment

---

## Animation & Interaction

**Use Sparingly**:
- Speaking indicator: Subtle pulse animation (scale and opacity)
- Transcription appearance: Quick fade-in (0.2s)
- Modal/panel transitions: Slide-in with ease-out (0.3s)
- Button interactions: Scale on press (transform: scale(0.98))

**No Animations On**:
- Real-time transcription text
- Language switching
- Connection status changes (instant feedback preferred)

---

## Responsive Behavior

**Breakpoints**:
- Mobile (< 768px): Single column, stacked panels, simplified navigation
- Tablet (768px - 1024px): Maintain desktop layout with adjusted spacing
- Desktop (> 1024px): Full featured layout as described

**Mobile Specific**:
- Translation panels stack vertically instead of side-by-side
- Top bar condenses to essential info only
- Settings panel becomes full-screen modal
- Hero section uses text-3xl instead of text-6xl

---

## Icon Library

**Use Heroicons (via CDN)** exclusively for all icons:
- Microphone, microphone-slash (mute)
- Speaker wave, speaker-x-mark
- Language, globe-alt
- Link, clipboard
- Cog (settings)
- Phone-x-mark (end call)
- Signal (connection quality)

---

## Images

**Hero Section Image**:
- Placement: Background or alongside hero text (60% width on desktop)
- Description: Modern illustration showing two diverse people having a conversation with floating speech bubbles containing different scripts (Latin, Arabic, Asian characters) transforming between them. Clean, professional style with subtle gradients.
- Style: Vector illustration or high-quality graphic, not photographic
- Treatment: If background, use overlay for text legibility

**How It Works Section**:
- 3 simple iconographic illustrations for each step
- Style: Line art or simple 2D illustrations matching hero style
- Placement: Above each step description

No other images needed - keep interface clean and functional during active use.