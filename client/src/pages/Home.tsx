import { Link } from "wouter";
import { Languages, Zap, Lock, Link as LinkIcon, Globe, Mic, CheckCircle, Sparkles, MessageSquare, ArrowRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern Engaging Design */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center py-20">
            {/* Left: Content */}
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="block text-white">Speak Any</span>
                <span className="block text-white">Language,</span>
                <span className="block mt-2 bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                  Connect Everyone
                </span>
              </h1>
              
              <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
                Break down language barriers with AI-powered real-time voice translation. 
                Natural conversations across 15+ languages, instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/create">
                  <Button 
                    size="lg" 
                    className="text-base px-8 h-14 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 group relative overflow-hidden" 
                    data-testid="button-create-room"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    <Mic className="mr-2 h-5 w-5 relative z-10" />
                    <span className="relative z-10">Start Now</span>
                    <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-8 h-14 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white backdrop-blur-sm"
                    data-testid="button-learn-more"
                  >
                    How It Works
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <div className="text-2xl font-bold text-white">15+</div>
                  <div className="text-sm text-slate-400 mt-1">Languages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">&lt;100ms</div>
                  <div className="text-sm text-slate-400 mt-1">Latency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Live</div>
                  <div className="text-sm text-slate-400 mt-1">Translation</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Demo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-3xl blur-3xl opacity-50" />
              
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* User 1 - Speaking */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-2xl blur opacity-25 group-hover:opacity-40 transition" />
                    <div className="relative flex items-start gap-4 p-5 bg-slate-800/80 rounded-2xl">
                      <div className="relative flex-shrink-0">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/40">
                          <img 
                            src="https://flagcdn.com/w80/us.png"
                            width="32"
                            height="24"
                            alt="US"
                            className="rounded"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <div className="h-4 w-4 bg-success rounded-full border-2 border-slate-900 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-white">You</span>
                          <span className="text-xs text-slate-500">English</span>
                        </div>
                        <p className="text-white font-medium">"Hello! How are you today?"</p>
                        <div className="flex gap-1 mt-3">
                          <div className="h-1 w-12 bg-primary rounded-full animate-pulse" />
                          <div className="h-1 w-8 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="h-1 w-6 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Translation Flow */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50 animate-pulse" />
                      <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/10">
                        <Languages className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                  </div>

                  {/* User 2 - Listening */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-cyan-500/50 rounded-2xl blur opacity-25 group-hover:opacity-40 transition" />
                    <div className="relative flex items-start gap-4 p-5 bg-slate-800/80 rounded-2xl">
                      <div className="relative flex-shrink-0">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center ring-2 ring-accent/40">
                          <img 
                            src="https://flagcdn.com/w80/es.png"
                            width="32"
                            height="24"
                            alt="ES"
                            className="rounded"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <div className="h-4 w-4 bg-success rounded-full border-2 border-slate-900" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-white">Partner</span>
                          <span className="text-xs text-slate-500">Español</span>
                        </div>
                        <p className="text-white font-medium">"¡Hola! ¿Cómo estás hoy?"</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Volume2 className="h-4 w-4 text-accent" />
                          <span className="text-xs text-accent font-medium">Playing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Seamless Translation Experience
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with anyone, anywhere, in any language
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="hover-elevate border-border/50" data-testid="card-feature-translation">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20">
                  <Languages className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Real-Time Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Speak naturally and hear instant translations with minimal latency using Azure AI
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-border/50" data-testid="card-feature-latency">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center mb-6 ring-1 ring-warning/20">
                  <Zap className="h-7 w-7 text-warning" />
                </div>
                <CardTitle className="text-xl">Low Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Experience smooth conversations with optimized WebSocket connections
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-border/50" data-testid="card-feature-secure">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-xl bg-success/10 flex items-center justify-center mb-6 ring-1 ring-success/20">
                  <Lock className="h-7 w-7 text-success" />
                </div>
                <CardTitle className="text-xl">Secure Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Private conversation rooms with unique IDs for secure communication
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-border/50" data-testid="card-feature-sharing">
              <CardHeader className="pb-4">
                <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 ring-1 ring-accent/20">
                  <LinkIcon className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-xl">Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Share room links instantly and start conversations with a single click
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start translating in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
                <span className="text-4xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Create a Room</h3>
              <p className="text-muted-foreground leading-relaxed">
                Choose your language and create a private conversation room
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-accent/20">
                <span className="text-4xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-xl font-semibold">Share the Link</h3>
              <p className="text-muted-foreground leading-relaxed">
                Send the room link to your conversation partner
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-success/20">
                <span className="text-4xl font-bold text-success">3</span>
              </div>
              <h3 className="text-xl font-semibold">Start Talking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Speak naturally and hear real-time translations instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-accent/10 border border-primary/20">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Break Language Barriers?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start your first conversation today and experience the power of real-time AI translation
            </p>
            <Link href="/create">
              <Button 
                size="lg" 
                className="text-base px-10 py-6 h-auto hover-elevate active-elevate-2"
                data-testid="button-cta"
              >
                <Mic className="mr-2 h-5 w-5" />
                Create Your First Room
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
