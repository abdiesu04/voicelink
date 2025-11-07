import { Link } from "wouter";
import { Languages, Lock, Globe, Mic, CheckCircle, Sparkles, MessageSquare, ArrowRight, Volume2, Users, Clock, Shield, Briefcase } from "lucide-react";
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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-5xl mx-auto text-center py-20 pt-32 space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block text-slate-900 dark:text-white">Erase every</span>
              <span className="block text-slate-900 dark:text-white">language barrier</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Voztra instantly translates your voice into another language — same tone, same emotion, same gender — so you sound like a native speaker across 97+ languages.
            </p>

            <p className="text-lg text-slate-500 dark:text-slate-400 italic">
              It's your voice, simply understood everywhere.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="text-lg px-10 h-16 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 group relative overflow-hidden" 
                  data-testid="button-try-voztra"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <Mic className="mr-2 h-6 w-6 relative z-10" />
                  <span className="relative z-10">Try Voztra Free</span>
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-10 h-16 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur"
                  data-testid="button-watch-demo"
                >
                  <Volume2 className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Speak naturally, be understood instantly */}
      <section id="features" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Speak naturally,<br />be understood instantly
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Voztra lets two people speak in real time, each in their own language — while both hear each other as if they were native speakers. No text, no subtitles, no delay.
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
                  We match your tone, emotion, and gender so it truly sounds like you.
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
                  <Globe className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Everywhere you talk</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Works seamlessly in calls, meetings, and in-person conversations.
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
              Three simple steps.<br />One fluent conversation.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
                <span className="text-4xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">You speak</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Naturally, in your own language. No scripts, no preparation.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-violet-500/20">
                <span className="text-4xl font-bold text-violet-500">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Voztra translates</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your voice becomes native-sounding in real time with AI precision.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20">
                <span className="text-4xl font-bold text-green-500">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">They hear you</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your words, tone, and warmth — perfectly preserved in their language.
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
              Currently supporting <span className="text-primary font-semibold">97+ languages</span> for real-time voice translation with more being added continuously.
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
                  <span className="font-semibold text-slate-900 dark:text-white">All 101+ Languages</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Global Language Coverage
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  97 real-time voice translation, preserving tone, emotion and gender in real-time voice chat.
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
                    Access talent from 97+ languages. Hire the best developer in São Paulo, the best designer in Seoul, the best strategist in Stockholm — all on one team.
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
                Free to try • No credit card required • 97+ languages supported
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
                  Breaking language barriers with real-time voice translation across 97+ languages.
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
