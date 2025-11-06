# Voice Translation App - Design Guidelines

## Design Approach

**Selected Approach**: Design System-Based with Communication Tool Inspiration

Drawing from Discord, Linear, and Zoom, this design prioritizes clarity and real-time feedback with a premium, professional aesthetic. The Aurora Slate palette creates a sophisticated atmosphere that inspires trust while maintaining excellent readability during active translation.

**Core Principles**:
- Premium professionalism: Elevated design that works for business and personal contexts
- Immediate clarity: Instant understanding of connection state and active speaker
- Spacious hierarchy: Generous whitespace with color-coded visual organization
- Color communication: Language pairs and statuses distinguished through strategic color use

---

## Color System: Aurora Slate Palette

**Foundation Colors**:
- Deep Slate: `#0f172a` - Primary background
- Slate 800: `#1e293b` - Secondary background, cards
- Slate 700: `#334155` - Tertiary surfaces
- Slate 600: `#475569` - Borders, dividers
- Slate 400: `#94a3b8` - Muted text
- Slate 100: `#f1f5f9` - Primary text on dark

**Brand & Interactive Colors**:
- Desaturated Indigo: `#6366f1` (primary indigo-500)
- Indigo Muted: `#4f46e5` (indigo-600) - Hover states
- Indigo Glow: `#818cf8` (indigo-400) - Active indicators
- Emerald Success: `#10b981` (emerald-500) - Connected, speaking states
- Emerald Dim: `#059669` (emerald-600) - Success elements
- Amber Warning: `#f59e0b` (amber-500) - Caution states
- Rose Danger: `#f43f5e` (rose-500) - Disconnected, error states

**Language Color Coding**:
- Language A (User): Indigo `#6366f1` - Used for user's language indicators
- Language B (Partner): Cyan `#06b6d4` (cyan-500) - Partner's language indicators
- Translation Flow: Gradient transitions between language colors

**Application**:
- Backgrounds: Deep slate foundation with slate-800 elevated cards
- Text: Slate-100 primary, slate-400 secondary
- Interactive elements: Indigo primary, emerald success feedback
- Status indicators: Color-coded by state (emerald=active, amber=processing, rose=error)
- Language panels: Subtle indigo/cyan tinted backgrounds for user/partner sections

---

## Typography System

**Font Family**: Inter (Google Fonts) for all text

**Hierarchy**:
- Hero Headlines: text-5xl to text-6xl, font-bold, text-slate-100
- Page Titles: text-3xl, font-semibold, text-slate-100
- Section Headers: text-xl, font-semibold, text-slate-200
- Body Text: text-base, font-normal, text-slate-300
- Real-time Transcription: text-lg, font-normal, text-slate-100
- UI Labels: text-sm, font-medium, text-slate-400, uppercase tracking-wide
- Status Text: text-xs, font-semibold, uppercase tracking-wider

---

## Layout System

**Spacing Primitives**: Tailwind units of **4, 6, 8, 12, 16, 20**

**Application**:
- Component padding: p-6, p-8
- Section spacing: py-16, py-20, gap-12
- Card padding: p-8, p-12
- Element gaps: gap-4, gap-6, gap-8
- Generous margins for spacious feel

---

## Component Library

### Landing Page Components

**Hero Section** (80vh):
- Full-width dark slate gradient background
- Max-w-7xl centered content with two-column layout
- Left (55%): 
  - Headline with indigo accent word
  - Subheadline in slate-300
  - Button group: Primary indigo CTA + secondary outline
  - Trust badge: "Powered by Azure AI" with emerald check icon
- Right (45%): Hero image showing translation visualization
- Buttons over background have backdrop-blur-md with semi-transparent backgrounds

**Features Grid** (py-20):
- 4 cards in grid (2x2 on desktop, 1 column mobile)
- Each card: slate-800 background, p-8, rounded-xl, border border-slate-700
- Indigo icon in rounded background (p-4, bg-indigo-500/10)
- Features: Real-Time Translation, Enterprise Security, 100+ Languages, HD Audio Quality
- Icons from Heroicons: language, lock-closed, globe-alt, speaker-wave

**How It Works** (py-20):
- 3-step horizontal flow with connecting gradient lines
- Numbered badges (indigo gradient circles)
- Step cards: slate-800, p-8, with illustrations
- Step 1: Create & Select (user icon + language dropdown visual)
- Step 2: Share Link (link icon + QR code visual)  
- Step 3: Speak Naturally (waveform + translation visual)

**Language Showcase** (py-16):
- Grid of 12 language pills (3 rows × 4 columns)
- Each pill: slate-700 background, px-6 py-3, rounded-full
- Flag emoji + language name in slate-200

**Social Proof** (py-20):
- 3 testimonial cards with slate-800 backgrounds
- Avatar placeholder, quote, name, role in slate-400
- 5-star rating in amber-400

**Final CTA** (py-24):
- Centered content max-w-3xl
- Large heading with indigo accent
- Primary CTA button (large, px-10 py-5)
- Subtext: "No credit card required • Start translating in 30 seconds"

**Footer** (py-12):
- Slate-900 background
- 4-column grid: Product, Company, Legal, Connect
- Bottom bar: Copyright in slate-500, social icons in slate-400

### Application Interface

**Room Creation Card**:
- Centered max-w-lg card, slate-800 background, p-10, rounded-2xl
- Heading with indigo underline accent
- Language selector: slate-700 dropdown with indigo focus ring
- Create button: Full-width indigo gradient with emerald glow on hover

**Active Translation Interface**:

Top Bar (h-16, slate-900/95 backdrop-blur):
- Left: Emerald connection dot + "Connected • 45ms"
- Center: Language pair "English → Español" with color-coded arrows
- Right: Settings icon, End button (rose-500 outline)

Main Display (split 50/50):
- Left Panel (User - indigo-tinted):
  - Header: "You (English)" with indigo accent
  - Speaking indicator: Emerald pulsing ring when active
  - Transcription area: slate-800 background, scrollable
  - Your text: slate-100, translation below in cyan-400/60
- Right Panel (Partner - cyan-tinted):
  - Header: "Partner (Español)" with cyan accent
  - Mirror layout with cyan speaking indicator
  - Partner text: slate-100, translation in indigo-400/60

Bottom Control Bar (h-20):
- Center controls:
  - Mic toggle: Large circular (w-16 h-16), emerald when active, slate-700 when muted
  - Volume slider: Indigo track with emerald thumb
  - End call: Rose-500 outline button

Status Bar (top of main display):
- Translation status pills: "Listening..." (emerald), "Translating..." (amber), "Ready" (slate-600)

**Settings Panel** (slide-in from right):
- Full-height slate-800 panel, w-96
- Sections with slate-700 dividers
- Language dropdowns with indigo accents
- Toggle switches for audio settings (indigo/emerald states)

---

## Images

**Hero Section**:
- Placement: Right side of hero (45% width)
- Description: Abstract 3D visualization of voice translation - two floating spheres connected by flowing particle streams, with holographic language text fragments floating around them. Dark background with indigo and cyan accent lighting. Premium, futuristic aesthetic.
- Treatment: PNG with transparency, subtle glow effects

**How It Works Steps**:
- Step 1: Minimalist illustration of device with language selection interface
- Step 2: Stylized link/QR code with connection visualization  
- Step 3: Waveform visualization transforming between two language scripts
- Style: Line art with indigo/cyan accents on transparent backgrounds

---

## Animations

**Strategic Use**:
- Speaking indicator: Emerald pulse (scale 1.0 to 1.1, opacity 1 to 0.5)
- Transcription text: Fade-in 0.2s with slight slide-up
- Panel transitions: 0.3s ease-out
- Status changes: Color transition 0.15s
- Button press: Scale 0.98 with brightness shift

---

## Responsive Behavior

**Mobile** (<768px):
- Hero: Single column, image below text
- Features: 1 column grid
- Translation panels: Stacked vertically
- Top bar: Condensed with hamburger menu
- All px-6 container padding

**Desktop** (>1024px):
- Full layout as described
- Translation panels side-by-side
- px-8 to px-12 container padding

---

## Icons

**Heroicons Library** (outline style):
- language, microphone, speaker-wave, link, cog-6-tooth, phone-x-mark, signal, lock-closed, globe-alt, check-circle, clipboard-document