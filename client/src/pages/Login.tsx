import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { VoztraLogo } from "@/components/VoztraLogo";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/ui/glass-card";
import { fadeInUp, staggerContainer } from "@/lib/motion-variants";
import { Globe, Users, Shield, Zap, CheckCircle2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
        variant: "success",
      });
      setLocation("/create");
    } catch (error) {
      toast({
        title: "Unable to sign in",
        description: "Please check your email and password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Globe, text: "47+ languages supported" },
    { icon: Zap, text: "Real-time translation" },
    { icon: Shield, text: "Secure & encrypted" },
    { icon: Users, text: "Two-person conversations" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row w-full pt-20 lg:pt-0">
        
        {/* Left Side: Brand & Value Proposition */}
        <motion.div 
          className="relative lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center items-center text-center lg:text-left overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatedBackground />
          
          <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 lg:mb-12"
            >
              <VoztraLogo 
                width={240}
                height={72}
                className="text-slate-900 dark:text-white mx-auto lg:mx-0"
              />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
            >
              Welcome Back to{" "}
              <span className="text-gradient">Voztra</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-8"
            >
              Continue breaking language barriers with real-time voice translation
            </motion.p>

            {/* Features Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-4 mb-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"
                >
                  <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="hidden lg:flex items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-200/20 dark:border-indigo-500/20"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Break language barriers instantly
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Voice translation across 47 languages
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-10 shadow-2xl border-2 border-white/30 dark:border-white/10" data-testid="card-login">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-10"
              >
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  Sign In
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                  Enter your credentials to access your account
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <Label htmlFor="email" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 px-4 text-base font-medium bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                    data-testid="input-email"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Label htmlFor="password" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 text-base font-medium bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                    data-testid="input-password"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  className="relative py-4"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">OR</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    type="button"
                    onClick={() => window.location.href = "/api/auth/google"}
                    className="w-full h-14 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl border-2 border-slate-300 dark:border-slate-600 hover:scale-[1.02] transition-all duration-300"
                    disabled={isLoading}
                    data-testid="button-google-login"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </span>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-center pt-2"
                >
                  <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline decoration-2 underline-offset-2 transition-colors"
                      data-testid="link-register"
                    >
                      Create one now
                    </Link>
                  </p>
                </motion.div>
              </form>

              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-8 pt-6 border-t-2 border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Your data is secure and encrypted</span>
                </div>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
