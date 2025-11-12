import { Button } from "@/components/ui/button";
import { ArrowRight, Globe2, Lock, Mic, Users, Zap, Quote } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import testimonialImg1 from "@assets/stock_images/professional_headsho_32cf619f.jpg";
import testimonialImg2 from "@assets/stock_images/professional_headsho_39f9f9b0.jpg";
import testimonialImg3 from "@assets/stock_images/professional_headsho_d46cf359.jpg";
import testimonialImg4 from "@assets/stock_images/professional_headsho_742b1763.jpg";
import testimonialImg5 from "@assets/stock_images/professional_headsho_421e080c.jpg";
import testimonialImg6 from "@assets/stock_images/professional_headsho_a0928d48.jpg";
import testimonialImg7 from "@assets/stock_images/professional_headsho_18007542.jpg";
import teamImg1 from "@assets/stock_images/modern_office_team_c_9f0cd92a.jpg";
import teamImg2 from "@assets/stock_images/modern_office_team_c_b038df97.jpg";
import teamImg3 from "@assets/stock_images/modern_office_team_c_a4e7ef71.jpg";

const VoiceTranslator = () => {
  const testimonials = [
    {
      name: "Sofia M.",
      location: "Los Angeles",
      quote: "For the first time, my grandmother in Tokyo heard me in Japanese — with my real voice.",
      image: testimonialImg1
    },
    {
      name: "Julien R.",
      location: "Paris",
      quote: "Our global meetings feel human again — no translators, no lag, just genuine connection.",
      image: testimonialImg2
    },
    {
      name: "Marcus R.",
      location: "London",
      quote: "I made friends backpacking across Spain without switching to English once. Life-changing.",
      image: testimonialImg3
    },
    {
      name: "Yuki T.",
      location: "Tokyo",
      quote: "Closing international deals has never been easier. My clients feel truly understood.",
      image: testimonialImg4
    },
    {
      name: "Carlos G.",
      location: "Buenos Aires",
      quote: "Teaching students across continents feels like we're in the same room. The future is here.",
      image: testimonialImg5
    },
    {
      name: "Layla A.",
      location: "Dubai",
      quote: "Video calls with my family abroad now feel warm and personal, not robotic.",
      image: testimonialImg6
    },
    {
      name: "Kwame O.",
      location: "Accra",
      quote: "Networking at global conferences is effortless. I can be myself in any language.",
      image: testimonialImg7
    }
  ];

  const MAJOR_LANGUAGES = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", 
    "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi",
    "Dutch", "Turkish", "Swedish", "Polish", "Indonesian", "Vietnamese"
  ];

  const ALL_LANGUAGES = [
    "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Azerbaijani",
    "Bashkir", "Basque", "Belarusian", "Bengali", "Bosnian", "Breton", "Bulgarian",
    "Cantonese", "Catalan", "Chinese", "Croatian", "Czech", "Danish", "Dutch",
    "English", "Estonian", "Faroese", "Finnish", "French", "Galician", "Georgian",
    "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew",
    "Hindi", "Hungarian", "Icelandic", "Indonesian", "Italian", "Japanese", "Javanese",
    "Kannada", "Kazakh", "Khmer", "Korean", "Lao", "Latin", "Latvian", "Lingala",
    "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam",
    "Maltese", "Mandarin", "Maori", "Marathi", "Mongolian", "Myanmar", "Nepali",
    "Norwegian", "Nynorsk", "Occitan", "Pashto", "Persian", "Polish", "Portuguese",
    "Punjabi", "Romanian", "Russian", "Sanskrit", "Serbian", "Shona", "Sindhi",
    "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili",
    "Swedish", "Tagalog", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Tibetan",
    "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Yiddish", "Yoruba"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-20" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[1.1]">
              Erase every <br />
              <span className="text-violet-400">language barrier</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Voztra instantly translates your <span className="text-primary font-semibold">voice</span> into another language — same tone, same emotion, same gender — so you sound like a native speaker across <span className="text-primary font-semibold">47 languages</span>.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground/80 italic font-medium">
              It's your voice, simply understood everywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg" className="text-lg px-10 h-14 shadow-glow">
                <Link href="/create">
                  Try Voztra Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-10 h-14">
                <a href="#demo">Watch Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-6xl font-display font-bold">
                Speak naturally, <br className="hidden md:block" />be understood instantly
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Voztra lets two people speak in real time, each in their own language — while both hear each other as if they were native speakers. No text, no subtitles, no delay.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Real-time voice translation</h3>
                <p className="text-muted-foreground leading-relaxed">Sub-second speed keeps conversation flowing naturally, just like talking face-to-face.</p>
              </Card>
              
              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Mic className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Your voice, their language</h3>
                <p className="text-muted-foreground leading-relaxed">We match your tone, emotion, and gender so it truly sounds like you.</p>
              </Card>
              
              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Private by design</h3>
                <p className="text-muted-foreground leading-relaxed">Encrypted voice streams and on-device modes keep your conversations secure.</p>
              </Card>
              
              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Everywhere you talk</h3>
                <p className="text-muted-foreground leading-relaxed">Works seamlessly in calls, meetings, and in-person conversations.</p>
              </Card>
            </div>
            
            <div className="text-center mt-12">
              <Button asChild size="lg" className="shadow-glow">
                <Link href="/create">Try Voztra now <ArrowRight className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-center mb-6">
              Three simple steps. <br className="hidden md:block" />One fluent conversation.
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mt-16">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto shadow-glow">
                    <span className="text-4xl font-display font-bold text-primary-foreground">1</span>
                  </div>
                </div>
                <h3 className="text-2xl font-display font-semibold">You speak</h3>
                <p className="text-muted-foreground leading-relaxed">Naturally, in your own language. No scripts, no preparation.</p>
              </div>
              
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto shadow-glow">
                    <span className="text-4xl font-display font-bold text-primary-foreground">2</span>
                  </div>
                </div>
                <h3 className="text-2xl font-display font-semibold">Voztra translates</h3>
                <p className="text-muted-foreground leading-relaxed">Your voice becomes native-sounding in real time with AI precision.</p>
              </div>
              
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto shadow-glow">
                    <span className="text-4xl font-display font-bold text-primary-foreground">3</span>
                  </div>
                </div>
                <h3 className="text-2xl font-display font-semibold">They hear you</h3>
                <p className="text-muted-foreground leading-relaxed">Your words, tone, and warmth — perfectly preserved in their language.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section id="languages" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold">
              Speak with the world
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Currently supporting <span className="text-primary font-semibold">47 languages</span> for real-time voice translation with more being added continuously.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              {["Hello", "Hola", "你好", "مرحبا", "Bonjour", "こんにちは", "Ciao", "Привет", "नमस्ते", "안녕하세요"].map((greeting) => (
                <div key={greeting} className="px-8 py-4 rounded-full bg-card border shadow-card text-lg font-medium hover:shadow-glow transition-all hover:-translate-y-0.5">
                  {greeting}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Language Support Details */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-6">
              Global Language Coverage
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
              47 languages with real-time voice translation, preserving tone, emotion and gender in real-time voice chat.
            </p>

            <Card className="p-8 shadow-card hover:shadow-glow transition-all">
              <div className="flex items-center gap-3 mb-6 justify-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Globe2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-semibold">All {ALL_LANGUAGES.length}+ Languages</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {ALL_LANGUAGES.map((lang) => (
                  <span 
                    key={lang} 
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-sm font-medium transition-all duration-300 hover:bg-primary/20 hover:scale-110 hover:shadow-md hover:-translate-y-1 cursor-default"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </Card>

            <div className="mt-12 p-6 rounded-xl bg-muted/30 border text-center">
              <p className="text-muted-foreground">
                <strong>Advanced AI Technology:</strong> Voztra uses cutting-edge neural networks to deliver accurate, natural-sounding translations 
                that preserve the nuances of human speech across all supported languages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/30 via-background to-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-6xl font-display font-bold">
                When barriers disappear, <br className="hidden md:block" />connection begins
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real stories from people who've experienced the power of truly natural voice translation
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="group relative p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 bg-gradient-to-br from-card via-card to-card/80 border-2 hover:border-primary/50 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="mb-6 flex items-center gap-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300 group-hover:scale-110"
                      />
                      <Quote className="w-10 h-10 text-primary/30 group-hover:text-primary/60 transition-colors duration-300 ml-auto" />
                    </div>
                    
                    <p className="text-lg leading-relaxed mb-6 group-hover:text-foreground transition-colors duration-300">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="pt-4 border-t border-border/50">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Globe2 className="w-3 h-3" />
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-2xl font-display font-semibold bg-gradient-primary bg-clip-text text-transparent">
                Join thousands connecting across languages every day
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-6xl font-display font-bold">
                Hire the world's best talent, <br className="hidden md:block" />no language required
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Don't let language limit your hiring pool. With Voztra, you can recruit, interview, and collaborate with top talent from any country — all in real-time, preserving every nuance of communication.
              </p>
            </div>

            <div className="mb-16 relative overflow-hidden rounded-2xl">
              <img 
                src={teamImg1} 
                alt="Global team collaboration"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent rounded-2xl" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Global recruitment made effortless</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Conduct interviews in any language without interpreters. Your candidates hear you in their native tongue, and you hear them in yours — naturally and in real-time.
                </p>
              </Card>

              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Build truly diverse teams</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access talent from 47 languages. Hire the best developer in São Paulo, the best designer in Seoul, the best strategist in Stockholm — all on one team.
                </p>
              </Card>

              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Real-time collaboration at scale</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Daily standups, client calls, team meetings — all flow naturally across languages. No delays, no confusion, no expensive translation services.
                </p>
              </Card>

              <Card className="group p-8 lg:p-10 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Mic className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">Preserve company culture</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Voice translation maintains tone and emotion, so your team culture stays strong across borders. Everyone feels heard, understood, and valued.
                </p>
              </Card>
            </div>

            <Card className="p-10 lg:p-12 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-display font-bold text-center mb-6">
                  The competitive advantage of borderless hiring
                </h3>
                <p className="text-lg text-muted-foreground text-center mb-10">
                  Forward-thinking companies are already using Voztra to build exceptional global teams. Here's what becomes possible:
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  <div className="text-center p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-display font-bold text-primary mb-2">10x</div>
                    <p className="text-sm text-muted-foreground">Larger talent pool without language restrictions</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-display font-bold text-primary mb-2">80%</div>
                    <p className="text-sm text-muted-foreground">Reduction in translation costs for global teams</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-display font-bold text-primary mb-2">24/7</div>
                    <p className="text-sm text-muted-foreground">Continuous communication across time zones and languages</p>
                  </div>
                </div>

                <div className="bg-background/70 backdrop-blur-sm rounded-xl p-8 mb-8">
                  <h4 className="text-xl font-display font-semibold mb-4 text-center">Perfect for:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p>Remote-first companies building distributed teams</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p>Startups accessing global talent on tight budgets</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p>Enterprises managing international client relationships</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p>Agencies coordinating with global freelancers</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xl font-display font-semibold mb-6">
                    "Language should never be the reason you pass on exceptional talent."
                  </p>
                  <Button asChild size="lg" className="shadow-glow text-lg px-10 h-14">
                    <Link href="/create">Start Building Your Global Team <ArrowRight className="ml-2" /></Link>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">Free to try • No credit card required • 47 languages supported</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Global Impact */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold">
              Opening a new world <br className="hidden md:block" />of understanding
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every conversation through Voztra is a door opening — to new friendships, deeper relationships, and global business opportunities. When words flow freely, the world opens wider.
            </p>
            <div className="pt-8">
              <Users className="w-32 h-32 mx-auto text-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold">
              Your voice, <br className="hidden md:block" />your gateway to the world
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Voztra protects your privacy while expanding your reach. Every translation is encrypted and personal — your voice never becomes data, it becomes a bridge.
            </p>
            <p className="text-2xl md:text-3xl font-display font-semibold bg-gradient-primary bg-clip-text text-transparent italic pt-4">
              Voztra opens doors — to people, to places, to possibility.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground">
              Talk without barriers
            </h2>
            <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed">
              Start your first real-time translated conversation today — free, private, and truly human.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg" variant="secondary" className="text-lg px-10 h-14 shadow-2xl">
                <Link href="/create">
                  Try Voztra Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" className="text-lg px-10 h-14 bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
                <Link href="/create">Start Translating</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VoiceTranslator;
