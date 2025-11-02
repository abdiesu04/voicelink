import { Link, useLocation } from "wouter";
import { Languages, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 dark:border-slate-800/50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 hover-elevate active-elevate-2 px-3 py-2 rounded-xl transition-all cursor-pointer" data-testid="link-home">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                VoiceLink
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <div 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate cursor-pointer ${
                  isHome ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="nav-home"
              >
                Home
              </div>
            </Link>
            <a 
              href="#features" 
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover-elevate"
              data-testid="nav-features"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover-elevate"
              data-testid="nav-how-it-works"
            >
              How It Works
            </a>
          </nav>

          {/* CTA Button & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/create">
              <Button 
                size="default"
                className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20"
                data-testid="button-header-create"
              >
                <Mic className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Room</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
