import { Link } from "wouter";
import { Languages, Zap, Lock, Link as LinkIcon, Globe, Mic, CheckCircle, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto py-20">
            {/* Left Content */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-success/20 to-emerald-500/20 border border-success/30 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-success animate-pulse" />
                <span className="text-sm font-semibold text-success">Real-Time Translation</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-white">Break Language</span>
                <br />
                <span className="text-white">Barriers with</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                  AI Translation
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-xl md:text-2xl text-slate-300 max-w-xl leading-relaxed">
                Speak naturally in your language. Your partner hears it in theirs.
                <span className="text-white font-semibold"> Instantly.</span>
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/create">
                  <Button 
                    size="lg" 
                    className="text-base px-8 py-7 h-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 group" 
                    data-testid="button-create-room"
                  >
                    <Mic className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Start Conversation
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-8 py-7 h-auto border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white backdrop-blur-sm"
                    data-testid="button-learn-more"
                  >
                    <Globe className="mr-2 h-5 w-5" />
                    Explore Features
                  </Button>
                </a>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-8 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white">15+</div>
                  <div className="text-sm text-slate-400">Languages</div>
                </div>
                <div className="h-12 w-px bg-slate-700" />
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white">&lt;100ms</div>
                  <div className="text-sm text-slate-400">Latency</div>
                </div>
                <div className="h-12 w-px bg-slate-700" />
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white">100%</div>
                  <div className="text-sm text-slate-400">Secure</div>
                </div>
              </div>
            </div>
            
            {/* Right Visual */}
            <div className="hidden lg:flex items-center justify-center animate-in fade-in slide-in-from-right duration-700 delay-500">
              <div className="relative w-full max-w-lg">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-3xl blur-2xl opacity-30 animate-pulse" />
                
                {/* Main demo card */}
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                  {/* Top participant */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl border border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30">
                            <img 
                              src="https://flagcdn.com/w80/us.png"
                              width="32"
                              height="24"
                              alt="US"
                              className="rounded"
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-slate-800 animate-pulse" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">English</div>
                          <div className="text-xs text-slate-400">You</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1">
                          <div className="h-8 w-1 rounded-full bg-primary animate-pulse" />
                          <div className="h-8 w-1 rounded-full bg-primary/70 animate-pulse delay-75" />
                          <div className="h-8 w-1 rounded-full bg-primary/40 animate-pulse delay-150" />
                        </div>
                        <span className="text-xs text-primary font-medium">Speaking...</span>
                      </div>
                    </div>
                    
                    {/* Translation indicator */}
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-white/10">
                        <Languages className="h-5 w-5 text-white animate-pulse" />
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    </div>
                    
                    {/* Bottom participant */}
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-accent/10 to-transparent rounded-2xl border border-accent/20">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/30">
                            <img 
                              src="https://flagcdn.com/w80/es.png"
                              width="32"
                              height="24"
                              alt="ES"
                              className="rounded"
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-slate-800" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">Español</div>
                          <div className="text-xs text-slate-400">Partner</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        <span className="text-xs text-accent font-medium">Listening</span>
                      </div>
                    </div>
                    
                    {/* Message preview */}
                    <div className="mt-6 space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm text-white font-medium">"Hello, how are you?"</p>
                          <p className="text-xs text-slate-400 italic">"Hola, ¿cómo estás?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center animate-bounce">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-accent/20 to-cyan-500/20 backdrop-blur-sm border border-accent/30 flex items-center justify-center animate-pulse">
                  <Zap className="h-8 w-8 text-accent" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-12 w-8 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
            <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
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
