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
import { Globe, Users, Shield, Zap, Check, CheckCircle2, Gift, Mail, Lock, AlertCircle } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { score: 0, label: "", color: "" };
    if (pwd.length < 8) return { score: 1, label: "Weak", color: "bg-red-500" };
    
    let score = 1;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    if (score === 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
    if (score >= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
    return { score: 1, label: "Weak", color: "bg-red-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, confirmPassword);
      setStep(2);
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Globe, text: "140+ languages" },
    { icon: Gift, text: "60 minutes free" },
    { icon: Shield, text: "Secure & private" },
    { icon: Zap, text: "Instant translation" },
  ];

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-12 text-center" data-testid="card-success">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-slate-900 dark:text-white mb-2"
            >
              Welcome to Voztra!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 dark:text-slate-400 mb-6"
            >
              Your account has been created successfully
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-200/20 dark:border-indigo-500/20 space-y-3"
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <p className="font-medium text-slate-900 dark:text-white">{email}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <p className="font-semibold text-lg text-gradient">60 Free Minutes</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-6"
            >
              <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              Redirecting to home page...
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row w-full pt-20 lg:pt-0">
        
        {/* Left Side: Brand & Benefits */}
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
              Start Breaking{" "}
              <span className="text-gradient">Language Barriers</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-8"
            >
              Translate conversations in real-time across 140 languages with voice preservation
            </motion.p>

            {/* Benefits */}
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

            {/* Free Trial Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="hidden lg:block p-6 rounded-2xl bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-300/30 dark:border-violet-500/30"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">
                    60 Minutes Free
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Start translating immediately, no credit card required
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side: Registration Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8" data-testid="card-account-details">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Create Account
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Get started with 60 free minutes
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-white/50 dark:bg-black/30 border-white/20 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    data-testid="input-password"
                  />
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pt-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Password strength</span>
                        <span className={`font-semibold ${
                          passwordStrength.score === 1 ? 'text-red-600 dark:text-red-400' :
                          passwordStrength.score === 2 ? 'text-orange-600 dark:text-orange-400' :
                          passwordStrength.score === 3 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength.score
                                ? passwordStrength.color
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/50 dark:bg-black/30 border-white/20 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    data-testid="input-confirm-password"
                  />
                  {confirmPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 text-xs"
                    >
                      {password === confirmPassword ? (
                        <>
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400">Passwords don't match</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                    data-testid="button-create-account"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-center"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link 
                      href="/login" 
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
                      data-testid="link-login"
                    >
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              </form>

              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
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
