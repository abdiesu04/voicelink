import { Link } from "wouter";
import { Languages, Zap, Lock, Link as LinkIcon, Globe, Mic, CheckCircle, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Simplistic Modern Design */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        {/* Subtle accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-6xl">
          {/* Centered Content */}
          <div className="text-center space-y-8 py-20 animate-in fade-in duration-1000">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="block text-white mb-3">Talk Freely</span>
              <span className="block bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                Understand Perfectly
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Real-time voice translation powered by AI. Speak your language, they hear theirs.
            </p>
            
            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="text-base px-8 h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group" 
                  data-testid="button-create-room"
                >
                  <Mic className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Start Conversation
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* Simple Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">15+</div>
                <div className="text-sm text-slate-500">Languages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">&lt;100ms</div>
                <div className="text-sm text-slate-500">Latency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">AI Powered</div>
                <div className="text-sm text-slate-500">Azure Speech</div>
              </div>
            </div>

            {/* Visual Demo - Simplified */}
            <div className="max-w-2xl mx-auto pt-12">
              <div className="relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 md:p-12">
                {/* Subtle glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl" />
                
                <div className="relative space-y-6">
                  {/* Speaker 1 */}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                      <img 
                        src="https://flagcdn.com/w80/us.png"
                        width="28"
                        height="21"
                        alt="US"
                        className="rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Hello, how are you?</div>
                      <div className="text-xs text-slate-500">English</div>
                    </div>
                  </div>

                  {/* Translation Icon */}
                  <div className="flex justify-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Languages className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  {/* Speaker 2 */}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                      <img 
                        src="https://flagcdn.com/w80/es.png"
                        width="28"
                        height="21"
                        alt="ES"
                        className="rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Hola, ¿cómo estás?</div>
                      <div className="text-xs text-slate-500">Español</div>
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
