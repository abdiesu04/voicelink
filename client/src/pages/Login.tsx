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
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Globe, text: "140+ languages supported" },
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
                  Voice translation across 140 languages
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
            <GlassCard className="p-8" data-testid="card-login">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Sign In
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Enter your credentials to access your account
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/50 dark:bg-black/30 border-white/20 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    data-testid="input-email"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/50 dark:bg-black/30 border-white/20 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    data-testid="input-password"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
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
                className="mt-8 pt-6 border-t border-white/10 dark:border-white/5"
              >
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
