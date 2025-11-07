import { Link } from "wouter";
import { Languages, Lock, Mic, CheckCircle, Sparkles, MessageSquare, ArrowRight, Volume2, Users, Clock, Shield, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const languageGreetings = [
  { text: "Hello", lang: "English" },
  { text: "Hola", lang: "Spanish" },
  { text: "你好", lang: "Chinese" },
  { text: "مرحبا", lang: "Arabic" },
  { text: "Bonjour", lang: "French" },
  { text: "こんにちは", lang: "Japanese" },
  { text: "Ciao", lang: "Italian" },
  { text: "Привет", lang: "Russian" },
  { text: "नमस्ते", lang: "Hindi" },
  { text: "안녕하세요", lang: "Korean" },
];

// 75 country flags with ISO codes for real flag images
const countryFlags = [
  { code: 'us', name: 'United States' }, { code: 'gb', name: 'United Kingdom' }, { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' }, { code: 'jp', name: 'Japan' }, { code: 'cn', name: 'China' },
  { code: 'es', name: 'Spain' }, { code: 'it', name: 'Italy' }, { code: 'br', name: 'Brazil' },
  { code: 'mx', name: 'Mexico' }, { code: 'ca', name: 'Canada' }, { code: 'au', name: 'Australia' },
  { code: 'in', name: 'India' }, { code: 'kr', name: 'South Korea' }, { code: 'ru', name: 'Russia' },
  { code: 'ar', name: 'Argentina' }, { code: 'za', name: 'South Africa' }, { code: 'eg', name: 'Egypt' },
  { code: 'sa', name: 'Saudi Arabia' }, { code: 'tr', name: 'Turkey' }, { code: 'nl', name: 'Netherlands' },
  { code: 'se', name: 'Sweden' }, { code: 'no', name: 'Norway' }, { code: 'dk', name: 'Denmark' },
  { code: 'fi', name: 'Finland' }, { code: 'pl', name: 'Poland' }, { code: 'pt', name: 'Portugal' },
  { code: 'gr', name: 'Greece' }, { code: 'ch', name: 'Switzerland' }, { code: 'at', name: 'Austria' },
  { code: 'be', name: 'Belgium' }, { code: 'ie', name: 'Ireland' }, { code: 'nz', name: 'New Zealand' },
  { code: 'sg', name: 'Singapore' }, { code: 'my', name: 'Malaysia' }, { code: 'th', name: 'Thailand' },
  { code: 'vn', name: 'Vietnam' }, { code: 'ph', name: 'Philippines' }, { code: 'id', name: 'Indonesia' },
  { code: 'pk', name: 'Pakistan' }, { code: 'bd', name: 'Bangladesh' }, { code: 'ng', name: 'Nigeria' },
  { code: 'et', name: 'Ethiopia' }, { code: 'ke', name: 'Kenya' }, { code: 'tz', name: 'Tanzania' },
  { code: 'gh', name: 'Ghana' }, { code: 'ma', name: 'Morocco' }, { code: 'dz', name: 'Algeria' },
  { code: 'il', name: 'Israel' }, { code: 'ae', name: 'UAE' }, { code: 'qa', name: 'Qatar' },
  { code: 'jo', name: 'Jordan' }, { code: 'iq', name: 'Iraq' }, { code: 'ir', name: 'Iran' },
  { code: 'kz', name: 'Kazakhstan' }, { code: 'ua', name: 'Ukraine' }, { code: 'ro', name: 'Romania' },
  { code: 'cz', name: 'Czech Republic' }, { code: 'hu', name: 'Hungary' }, { code: 'bg', name: 'Bulgaria' },
  { code: 'rs', name: 'Serbia' }, { code: 'hr', name: 'Croatia' }, { code: 'sk', name: 'Slovakia' },
  { code: 'si', name: 'Slovenia' }, { code: 'lt', name: 'Lithuania' }, { code: 'lv', name: 'Latvia' },
  { code: 'ee', name: 'Estonia' }, { code: 'is', name: 'Iceland' }, { code: 'cl', name: 'Chile' },
  { code: 'co', name: 'Colombia' }, { code: 'pe', name: 'Peru' }, { code: 've', name: 'Venezuela' },
  { code: 'uy', name: 'Uruguay' }, { code: 'cu', name: 'Cuba' }, { code: 'cr', name: 'Costa Rica' },
  { code: 'lk', name: 'Sri Lanka' }, { code: 'np', name: 'Nepal' }, { code: 'mm', name: 'Myanmar' }
];

const allLanguages = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Azerbaijani",
  "Bashkir", "Basque", "Belarusian", "Bengali", "Bosnian", "Breton", "Bulgarian",
  "Cantonese", "Catalan", "Chinese", "Croatian", "Czech", "Danish", "Dutch", "English",
  "Estonian", "Faroese", "Finnish", "French", "Galician", "Georgian", "German", "Greek",
  "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hungarian",
  "Icelandic", "Indonesian", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh",
  "Khmer", "Korean", "Lao", "Latin", "Latvian", "Lingala", "Lithuanian", "Luxembourgish",
  "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Mandarin", "Maori",
  "Marathi", "Mongolian", "Myanmar", "Nepali", "Norwegian", "Nynorsk", "Occitan",
  "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian",
  "Sanskrit", "Serbian", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali",
  "Spanish", "Sundanese", "Swahili", "Swedish", "Tagalog", "Tajik", "Tamil", "Tatar",
  "Telugu", "Thai", "Tibetan", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uzbek",
  "Vietnamese", "Welsh", "Yiddish", "Yoruba"
];

const testimonials = [
  {
    name: "Sofia M.",
    location: "Los Angeles",
    quote: "For the first time, my grandmother in Tokyo heard me in Japanese — with my real voice.",
    avatar: "SM"
  },
  {
    name: "Julien R.",
    location: "Paris",
    quote: "Our global meetings feel human again — no translators, no lag, just genuine connection.",
    avatar: "JR"
  },
  {
    name: "Marcus R.",
    location: "London",
    quote: "I made friends backpacking across Spain without switching to English once. Life-changing.",
    avatar: "MR"
  },
  {
    name: "Yuki T.",
    location: "Tokyo",
    quote: "Closing international deals has never been easier. My clients feel truly understood.",
    avatar: "YT"
  },
  {
    name: "Carlos G.",
    location: "Buenos Aires",
    quote: "Teaching students across continents feels like we're in the same room. The future is here.",
    avatar: "CG"
  },
  {
    name: "Layla A.",
    location: "Dubai",
    quote: "Video calls with my family abroad now feel warm and personal, not robotic.",
    avatar: "LA"
  },
  {
    name: "Kwame O.",
    location: "Accra",
    quote: "Networking at global conferences is effortless. I can be myself in any language.",
    avatar: "KO"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section with Flag Collage & Floating Elements */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950" />
        
        {/* Real Flag Collage Background - 75 Flags */}
        <div className="absolute inset-0 opacity-25 dark:opacity-15">
          {countryFlags.map((flag, idx) => {
            const positions = [
              { top: '5%', left: '5%' }, { top: '8%', left: '15%' }, { top: '12%', left: '25%' },
              { top: '5%', left: '35%' }, { top: '10%', left: '45%' }, { top: '7%', left: '55%' },
              { top: '10%', left: '65%' }, { top: '6%', left: '75%' }, { top: '9%', left: '85%' },
              { top: '15%', left: '10%' }, { top: '18%', left: '20%' }, { top: '20%', left: '30%' },
              { top: '17%', left: '40%' }, { top: '22%', left: '50%' }, { top: '19%', left: '60%' },
              { top: '21%', left: '70%' }, { top: '16%', left: '80%' }, { top: '23%', left: '90%' },
              { top: '28%', left: '8%' }, { top: '30%', left: '18%' }, { top: '32%', left: '28%' },
              { top: '27%', left: '38%' }, { top: '33%', left: '48%' }, { top: '29%', left: '58%' },
              { top: '31%', left: '68%' }, { top: '26%', left: '78%' }, { top: '34%', left: '88%' },
              { top: '40%', left: '12%' }, { top: '42%', left: '22%' }, { top: '38%', left: '32%' },
              { top: '43%', left: '42%' }, { top: '39%', left: '52%' }, { top: '41%', left: '62%' },
              { top: '37%', left: '72%' }, { top: '44%', left: '82%' }, { top: '36%', left: '92%' },
              { top: '50%', left: '6%' }, { top: '52%', left: '16%' }, { top: '48%', left: '26%' },
              { top: '53%', left: '36%' }, { top: '49%', left: '46%' }, { top: '51%', left: '56%' },
              { top: '47%', left: '66%' }, { top: '54%', left: '76%' }, { top: '46%', left: '86%' },
              { top: '60%', left: '10%' }, { top: '62%', left: '20%' }, { top: '58%', left: '30%' },
              { top: '63%', left: '40%' }, { top: '59%', left: '50%' }, { top: '61%', left: '60%' },
              { top: '57%', left: '70%' }, { top: '64%', left: '80%' }, { top: '56%', left: '90%' },
              { top: '70%', left: '8%' }, { top: '72%', left: '18%' }, { top: '68%', left: '28%' },
              { top: '73%', left: '38%' }, { top: '69%', left: '48%' }, { top: '71%', left: '58%' },
              { top: '67%', left: '68%' }, { top: '74%', left: '78%' }, { top: '66%', left: '88%' },
              { top: '80%', left: '12%' }, { top: '82%', left: '22%' }, { top: '78%', left: '32%' },
              { top: '83%', left: '42%' }, { top: '79%', left: '52%' }, { top: '81%', left: '62%' },
              { top: '77%', left: '72%' }, { top: '84%', left: '82%' }, { top: '76%', left: '92%' },
              { top: '90%', left: '6%' }, { top: '92%', left: '16%' }, { top: '88%', left: '26%' },
              { top: '93%', left: '36%' }, { top: '89%', left: '46%' }, { top: '91%', left: '56%' },
              { top: '87%', left: '66%' }, { top: '94%', left: '76%' }, { top: '86%', left: '86%' },
              { top: '3%', left: '50%' }, { top: '13%', left: '5%' }, { top: '24%', left: '95%' },
              { top: '35%', left: '3%' }, { top: '45%', left: '96%' }, { top: '55%', left: '4%' },
              { top: '65%', left: '94%' }, { top: '75%', left: '6%' }, { top: '85%', left: '93%' },
              { top: '95%', left: '10%' }, { top: '4%', left: '92%' }, { top: '14%', left: '8%' },
              { top: '25%', left: '12%' }, { top: '36%', left: '88%' }, { top: '46%', left: '14%' },
              { top: '56%', left: '84%' }, { top: '66%', left: '16%' }, { top: '76%', left: '86%' },
              { top: '86%', left: '18%' }, { top: '96%', left: '82%' }, { top: '2%', left: '70%' },
              { top: '11%', left: '33%' }, { top: '21%', left: '23%' }, { top: '31%', left: '73%' },
              { top: '41%', left: '13%' }, { top: '51%', left: '83%' }, { top: '61%', left: '43%' },
              { top: '71%', left: '53%' }, { top: '81%', left: '63%' }, { top: '91%', left: '73%' }
            ];
            
            const position = positions[idx % positions.length];
            const sizes = ['w-12 h-8', 'w-14 h-9', 'w-16 h-11', 'w-10 h-7', 'w-11 h-7'];
            const size = sizes[idx % sizes.length];
            const duration = 3 + (idx % 5) * 0.3;
            const delay = (idx % 10) * 0.2;
            
            return (
              <img
                key={idx}
                src={`https://flagcdn.com/${flag.code}.svg`}
                alt={flag.name}
                className={`absolute ${size} object-cover rounded shadow-lg animate-float`}
                style={{
                  top: position.top,
                  left: position.left,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`
                }}
                loading="lazy"
              />
            );
          })}
        </div>

        {/* Neon Glow Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-500/20 dark:bg-violet-500/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/15 dark:bg-blue-500/25 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Floating Speech Bubbles with Multilingual Greetings */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Hello - English */}
          <div className="absolute top-24 left-16 animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }}>
            <div className="px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-700/50">
              <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Hello</p>
            </div>
          </div>

          {/* Bonjour - French */}
          <div className="absolute top-32 right-24 animate-float" style={{ animationDelay: '1s', animationDuration: '7s' }}>
            <div className="px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-700/50">
              <p className="text-lg font-semibold text-violet-600 dark:text-violet-400">Bonjour</p>
            </div>
          </div>

          {/* Hola - Spanish */}
          <div className="absolute top-1/3 left-24 animate-float" style={{ animationDelay: '2s', animationDuration: '6.5s' }}>
            <div className="px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-700/50">
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">Hola</p>
            </div>
          </div>

          {/* ሰላም - Amharic */}
          <div className="absolute bottom-1/3 right-20 animate-float" style={{ animationDelay: '3s', animationDuration: '7.5s' }}>
            <div className="px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-700/50">
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">ሰላም</p>
            </div>
          </div>

          {/* 你好 - Chinese */}
          <div className="absolute bottom-24 left-32 animate-float" style={{ animationDelay: '1.5s', animationDuration: '6.8s' }}>
            <div className="px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-700/50">
              <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">你好</p>
            </div>
          </div>

          {/* नमस्ते - Hindi */}
          <div className="absolute top-2/3 right-32 animate-float" style={{ animationDelay: '2.5s', animationDuration: '7.2s' }}>
            <div className="px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-700/50">
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">नमस्ते</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-6xl mx-auto text-center py-20 pt-32 space-y-10">
            {/* Central Microphone Icon with Glow */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 animate-pulse" />
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 flex items-center justify-center shadow-2xl ring-4 ring-white/20 dark:ring-slate-800/50">
                  <Mic className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            {/* New Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 dark:from-indigo-400 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                Break Language Barriers
              </span>
              <span className="block text-slate-900 dark:text-white mt-2">
                Instantly
              </span>
            </h1>
            
            {/* New Subtext */}
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Have real conversations across 47 languages. Two people, one room, instant voice translation.
            </p>

            {/* Glassmorphic Language Pair Cards */}
            <div className="flex flex-wrap justify-center gap-4 py-8 max-w-4xl mx-auto">
              <div className="px-6 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl border border-white/30 dark:border-slate-700/50 hover:scale-105 transition-transform" data-testid="card-en-fr">
                <p className="text-base md:text-lg font-semibold text-indigo-600 dark:text-indigo-400">English ↔ French</p>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl border border-white/30 dark:border-slate-700/50 hover:scale-105 transition-transform" data-testid="card-es-zh">
                <p className="text-base md:text-lg font-semibold text-violet-600 dark:text-violet-400">Spanish ↔ Chinese</p>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl border border-white/30 dark:border-slate-700/50 hover:scale-105 transition-transform" data-testid="card-de-ja">
                <p className="text-base md:text-lg font-semibold text-blue-600 dark:text-blue-400">German ↔ Japanese</p>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl border border-white/30 dark:border-slate-700/50 hover:scale-105 transition-transform" data-testid="card-ar-pt">
                <p className="text-base md:text-lg font-semibold text-emerald-600 dark:text-emerald-400">Arabic ↔ Portuguese</p>
              </div>
            </div>

            {/* CTA Buttons with Gradient */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="text-lg px-12 h-16 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500 hover:from-emerald-600 hover:via-blue-600 hover:to-violet-600 text-white shadow-2xl shadow-blue-500/50 group relative overflow-hidden border-0" 
                  data-testid="button-start-translating"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <Sparkles className="mr-2 h-6 w-6 relative z-10" />
                  <span className="relative z-10 font-bold">Start Translating</span>
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-10 h-16 border-2 border-indigo-300 dark:border-indigo-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-lg"
                  data-testid="button-watch-demo"
                >
                  <Volume2 className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </a>
            </div>

            {/* Connection Trail Visual */}
            <div className="pt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
              <span className="text-2xl">💬</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <span className="text-2xl">🌍</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500" />
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Speak naturally, be understood instantly */}
      <section id="features" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              One room. Two languages.<br />Zero barriers.
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Create a room, share the link, and start talking. You speak your language, they speak theirs — both hear each other perfectly translated in real time with natural voice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow" data-testid="card-realtime">
              <CardContent className="pt-8 pb-8 px-6 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center ring-1 ring-primary/20">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Real-time voice translation</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sub-second speed keeps conversation flowing naturally, just like talking face-to-face.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow" data-testid="card-voice">
              <CardContent className="pt-8 pb-8 px-6 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center ring-1 ring-violet-500/20">
                  <Volume2 className="h-7 w-7 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your voice, their language</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Choose your voice gender. AI preserves your tone and emotion in their language.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow" data-testid="card-private">
              <CardContent className="pt-8 pb-8 px-6 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center ring-1 ring-green-500/20">
                  <Shield className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Private by design</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Encrypted voice streams and on-device modes keep your conversations secure.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow" data-testid="card-everywhere">
              <CardContent className="pt-8 pb-8 px-6 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-500/20">
                  <Users className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Simple room-based chat</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Create a room, share the link. Two people join and talk — that's it.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/create">
              <Button size="lg" className="text-base px-8" data-testid="button-try-voztra-now">
                Try Voztra now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
                <span className="text-4xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Create a room</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Choose your language and voice gender. Get a shareable room link.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-violet-500/20">
                <span className="text-4xl font-bold text-violet-500">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Share the link</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Send the link to one person. They join, pick their language and voice.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20">
                <span className="text-4xl font-bold text-green-500">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Start talking</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Speak naturally. Hear each other instantly translated with natural voice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Language Coverage Section */}
      <section id="languages" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Speak with the world
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Supporting <span className="text-primary font-semibold">47 languages</span> with neural AI voices that match your tone, emotion, and gender.
            </p>
          </div>

          {/* Language greeting pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 max-w-4xl mx-auto">
            {languageGreetings.map((greeting, idx) => (
              <div 
                key={idx}
                className="px-6 py-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                data-testid={`greeting-${greeting.lang.toLowerCase()}`}
              >
                <span className="text-lg font-medium text-slate-900 dark:text-white">{greeting.text}</span>
              </div>
            ))}
          </div>

          {/* Global Language Coverage card */}
          <Card className="max-w-5xl mx-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-slate-900 dark:text-white">47 Supported Languages</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Talk to anyone in their language
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Each language includes male and female neural voices (94 total voices) that preserve your natural tone and emotion during translation.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {allLanguages.map((lang, idx) => (
                  <span 
                    key={idx}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-sm"
                    data-testid={`language-${lang.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-8 italic">
                <strong>Advanced AI Technology:</strong> Voztra uses cutting-edge neural networks to deliver accurate, natural-sounding translations that preserve the nuances of human speech across all supported languages.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              When barriers disappear,<br />connection begins
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <Card 
                key={idx}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
                data-testid={`testimonial-${testimonial.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center ring-2 ring-primary/20">
                      <span className="font-semibold text-slate-900 dark:text-white">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{testimonial.location}</div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Section */}
      <section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Hire the world's best talent,<br />no language required
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Don't let language limit your hiring pool. With Voztra, you can recruit, interview, and collaborate with top talent from any country — all in real-time, preserving every nuance of communication.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-8 space-y-4">
                  <Briefcase className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Global recruitment made effortless</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Conduct interviews in any language without interpreters. Your candidates hear you in their native tongue, and you hear them in yours — naturally and in real-time.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-8 space-y-4">
                  <Users className="h-10 w-10 text-violet-500" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Build truly diverse teams</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Connect with talent across 47 languages. Interview candidates in their native language while speaking yours — no interpreters needed.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-8 space-y-4">
                  <MessageSquare className="h-10 w-10 text-green-500" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Real-time collaboration at scale</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Daily standups, client calls, team meetings — all flow naturally across languages. No delays, no confusion, no expensive translation services.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-8 space-y-4">
                  <Sparkles className="h-10 w-10 text-amber-500" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Preserve company culture</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Voice translation maintains tone and emotion, so your team culture stays strong across borders. Everyone feels heard, understood, and valued.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-lg text-slate-600 dark:text-slate-300 italic mb-8">
                "Language should never be the reason you pass on exceptional talent."
              </p>
              <Link href="/create">
                <Button size="lg" className="text-base px-10 h-14" data-testid="button-build-team">
                  Start Building Your Global Team
                </Button>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                Free to try • No credit card required • 47 languages supported
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Opening a new world<br />of understanding
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Every conversation through Voztra is a door opening — to new friendships, deeper relationships, and global business opportunities. When words flow freely, the world opens wider.
            </p>
            <div className="pt-8">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Your voice,<br />your gateway to the world
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                Voztra protects your privacy while expanding your reach. Every translation is encrypted and personal — your voice never becomes data, it becomes a bridge.
              </p>
              <p className="text-xl text-slate-700 dark:text-slate-200 italic mb-8">
                Voztra opens doors — to people, to places, to possibility.
              </p>
              <div className="space-y-4">
                <h4 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Talk without barriers
                </h4>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  Start your first real-time translated conversation today — free, private, and truly human.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center">
                <Link href="/create">
                  <Button 
                    size="lg" 
                    className="text-lg px-12 h-16 shadow-xl"
                    data-testid="button-final-cta"
                  >
                    <Mic className="mr-2 h-6 w-6" />
                    Try Voztra Free
                  </Button>
                </Link>
                <Link href="/create">
                  <Button 
                    variant="outline"
                    size="lg" 
                    className="text-lg px-12 h-16 border-slate-300 dark:border-slate-700"
                    data-testid="button-start-translating"
                  >
                    Start Translating
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">VOZTRA</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Real-time voice translation for two-person conversations across 47 languages.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Opening the world, one voice at a time.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                  <li><a href="#languages" className="hover:text-primary transition-colors">Languages</a></li>
                  <li><Link href="/create" className="hover:text-primary transition-colors">Try Free</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Get Started</h4>
                <Link href="/create">
                  <Button className="w-full" data-testid="button-footer-cta">
                    <Mic className="mr-2 h-4 w-4" />
                    Start Now
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              © 2025 Voztra. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
