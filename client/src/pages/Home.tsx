import { Link } from "wouter";
import { Languages, Zap, Lock, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Break Language Barriers
              <br />
              <span className="text-primary">Speak Naturally</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Real-time voice translation powered by Azure AI. Speak in your language,
              and your conversation partner hears it in theirs - instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/create">
                <Button size="lg" className="text-lg px-8 hover-elevate active-elevate-2" data-testid="button-create-room">
                  Create Room
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 hover-elevate active-elevate-2"
                  data-testid="button-learn-more"
                >
                  Learn How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Seamless Translation Experience
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with anyone, anywhere, in any language
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="hover-elevate" data-testid="card-feature-translation">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Languages className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-Time Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Speak naturally and hear instant translations with minimal latency using Azure AI
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-latency">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Low Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Experience smooth conversations with optimized WebSocket connections
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-secure">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Private conversation rooms with unique IDs for secure communication
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-sharing">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <LinkIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share a simple link to invite others to your translation room
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start your multilingual conversation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Create & Choose</h3>
              <p className="text-muted-foreground">
                Create a room and select your preferred language from 15+ supported options
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Share Link</h3>
              <p className="text-muted-foreground">
                Share the unique room link with your conversation partner
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Speaking</h3>
              <p className="text-muted-foreground">
                Begin your conversation and hear real-time translations instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to break language barriers?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start your first translated conversation today
            </p>
            <Link href="/create">
              <Button size="lg" className="text-lg px-8 hover-elevate active-elevate-2" data-testid="button-cta-create">
                Create Your First Room
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Powered by Azure AI Services
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 VoiceLink. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
