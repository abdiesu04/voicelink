import { Link, useLocation } from "wouter";
import { Languages, Mic, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import voztraLogo from "@assets/a-sleek-modern-logo-design-featuring-the_5jxbgs8hQvK5S5yrYSdgMA_2dhjLRDZSF2HzmFCHzzOzA (1)_1762862046045.png";

export function Header() {
  const [location] = useLocation();
  const isHome = location === "/";
  const isPricing = location === "/pricing";
  const isAccount = location === "/account";
  const { user, subscription } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 dark:border-slate-800/30 bg-gradient-to-b from-indigo-50/60 via-violet-50/50 to-transparent dark:from-slate-950/60 dark:via-indigo-950/40 dark:to-transparent backdrop-blur-xl">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center hover-elevate active-elevate-2 transition-all cursor-pointer" data-testid="link-home">
              <img 
                src={voztraLogo} 
                alt="Voztra" 
                className="h-10 w-auto bg-white dark:bg-white rounded-lg px-3 py-1.5"
              />
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
            <Link href="/pricing">
              <div 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate cursor-pointer ${
                  isPricing ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="nav-pricing"
              >
                Pricing
              </div>
            </Link>
            {user && (
              <Link href="/account">
                <div 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate cursor-pointer ${
                    isAccount ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="nav-account"
                >
                  Account
                </div>
              </Link>
            )}
          </nav>

          {/* CTA Button & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            
            {user ? (
              <>
                {/* Credits Display */}
                {subscription && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/20" data-testid="credits-display">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {(subscription.creditsRemaining / 60).toFixed(1)} min
                    </span>
                  </div>
                )}

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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.email}</p>
                        {subscription && (
                          <p className="text-xs text-muted-foreground">
                            {(subscription.creditsRemaining / 60).toFixed(1)} minutes remaining
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/account">
                      <DropdownMenuItem data-testid="menu-item-account">
                        <User className="mr-2 h-4 w-4" />
                        Account Settings
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="default" data-testid="button-login">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    size="default"
                    className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20"
                    data-testid="button-register"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
