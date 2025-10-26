import { Link } from "wouter";
import { Languages, Zap, Lock, Link as LinkIcon, Globe, Mic, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-6 md:px-12 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Powered by Azure AI</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Break Language Barriers
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Speak Naturally
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed">
                Real-time voice translation powered by Azure AI. Speak in your language,
                and your conversation partner hears it in theirs - instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create">
                  <Button 
                    size="lg" 
                    className="text-base px-10 py-6 h-auto hover-elevate active-elevate-2" 
                    data-testid="button-create-room"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    Create Room
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base px-10 py-6 h-auto hover-elevate active-elevate-2"
                    data-testid="button-learn-more"
                  >
                    Learn How It Works
                  </Button>
                </a>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span>15+ Languages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span>Low Latency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span>Secure</span>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl">🇬🇧</span>
                        </div>
                        <div>
                          <div className="font-semibold">English</div>
                          <div className="text-xs text-muted-foreground">You</div>
                        </div>
                      </div>
                      <div className="text-success">
                        <div className="h-8 w-1 rounded-full bg-success animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      <Languages className="h-5 w-5" />
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="text-2xl">🇪🇸</span>
                        </div>
                        <div>
                          <div className="font-semibold">Español</div>
                          <div className="text-xs text-muted-foreground">Partner</div>
                        </div>
                      </div>
                      <div className="text-accent">
                        <div className="h-8 w-1 rounded-full bg-accent/50" />
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
      <section id="features" className="py-20 md:py-32">
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
                  Share a simple link to invite others to your translation room
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start your multilingual conversation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center space-y-6 group">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-semibold">Create & Choose</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create a room and select your preferred language from 15+ supported options
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-accent to-accent/70 text-foreground flex items-center justify-center text-3xl font-bold mx-auto shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-semibold">Share Link</h3>
              <p className="text-muted-foreground leading-relaxed">
                Share the unique room link with your conversation partner
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-success/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-success to-success/70 text-primary-foreground flex items-center justify-center text-3xl font-bold mx-auto shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold">Start Speaking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Begin your conversation and hear real-time translations instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to break <span className="text-primary">language barriers</span>?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start your first translated conversation today - no credit card required
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="text-base px-10 py-6 h-auto hover-elevate active-elevate-2" 
                  data-testid="button-cta-create"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Create Your First Room
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Powered by Azure AI Services
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/20">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">
                VoiceLink
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 VoiceLink. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded">About</a>
              <a href="#" className="hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
