import { Link } from "wouter";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="py-12 md:py-16 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="space-y-4">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">VOZTRA</h3>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Real-time voice translation for two-person conversations across 47 languages.
              </p>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 italic">
                Opening the world, one voice at a time.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Product</h4>
              <ul className="space-y-2 text-sm md:text-base text-slate-600 dark:text-slate-300">
                <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/create" className="hover:text-primary transition-colors">Try Free</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Company</h4>
              <ul className="space-y-2 text-sm md:text-base text-slate-600 dark:text-slate-300">
                <li><Link href="/voice-translator" className="hover:text-primary transition-colors" data-testid="link-footer-voice-translator">Voice Translator</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-primary transition-colors" data-testid="link-footer-privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/california-privacy-policy" className="hover:text-primary transition-colors" data-testid="link-footer-california-privacy">California Privacy Policy</Link></li>
                {user && (
                  <li><a href="mailto:support@getvoztra.com" className="hover:text-primary transition-colors" data-testid="link-footer-contact-us">Contact Us</a></li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Get Started</h4>
              <Link href={user ? "/create" : "/register"}>
                <Button className="w-full h-12 md:h-auto" data-testid="button-footer-cta">
                  <Mic className="mr-2 h-4 w-4" />
                  {user ? "Create Room" : "Start Free"}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="pt-6 md:pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
            © 2025 Voztra. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
