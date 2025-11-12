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
  const [step, setStep] = useState(1); // 1 = form, 2 = verify code, 3 = success
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<'success' | 'failed' | null>(null);
  const { user } = useAuth();
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

  const handleSendCode = async (e: React.FormEvent) => {
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
    setEmailSentStatus(null);

    try {
      const response = await fetch('/api/register/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Show email sent status
      setEmailSentStatus(data.emailSent ? 'success' : 'failed');
      
      toast({
        title: data.emailSent ? "Verification code sent!" : "Code generated",
        description: data.emailSent 
          ? "Check your email for a 6-digit code" 
          : "Email delivery failed, but you can contact support with your email",
      });

      setStep(2); // Move to verification step
    } catch (error) {
      setEmailSentStatus('failed');
      toast({
        title: "Failed to send code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code from your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: verificationCode,
          password,
          confirmPassword // Backend requires both password and confirmPassword
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Fire Facebook Pixel CompleteRegistration event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'CompleteRegistration');
      }

      setStep(3); // Move to success screen
      setTimeout(() => {
        window.location.href = "/"; // Force reload to update auth context
      }, 2000);
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setEmailSentStatus(null);

    try {
      const response = await fetch('/api/register/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setEmailSentStatus(data.emailSent ? 'success' : 'failed');

      toast({
        title: data.emailSent ? "New code sent!" : "Code regenerated",
        description: data.emailSent 
          ? "Check your email for the new 6-digit code" 
          : "Email delivery failed, but a new code was generated",
      });
    } catch (error) {
      setEmailSentStatus('failed');
      toast({
        title: "Failed to resend code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Globe, text: "47+ languages" },
    { icon: Gift, text: "60 minutes free" },
    { icon: Shield, text: "Secure & private" },
    { icon: Zap, text: "Instant translation" },
  ];

  // Step 2: Verify Code
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-12" data-testid="card-verify-code">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                We sent a 6-digit code to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
              </p>
            </motion.div>

            {/* Email Status Banner */}
            {emailSentStatus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl border-2 ${
                  emailSentStatus === 'success'
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {emailSentStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-bold ${
                      emailSentStatus === 'success'
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-amber-900 dark:text-amber-100'
                    }`}>
                      {emailSentStatus === 'success' ? 'Email sent successfully!' : 'Email delivery issue'}
                    </p>
                    <p className={`text-xs mt-1 ${
                      emailSentStatus === 'success'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {emailSentStatus === 'success' 
                        ? 'Check your inbox and spam folder' 
                        : 'Code generated but email may not have been delivered. Contact support if needed.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="code" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide text-center block mb-3">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="h-16 px-4 text-center text-2xl font-bold tracking-widest bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  data-testid="input-verification-code"
                  autoFocus
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                  disabled={isLoading || verificationCode.length !== 6}
                  data-testid="button-verify-code"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-3"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="w-full"
                  data-testid="button-resend-code"
                >
                  Resend Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="w-full text-sm"
                  data-testid="button-back"
                >
                  ← Back to registration
                </Button>
              </motion.div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 3) {
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
              Translate conversations in real-time across 47 languages with voice preservation
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
            <GlassCard className="p-10 shadow-2xl border-2 border-white/30 dark:border-white/10" data-testid="card-account-details">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  Create Account
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                  Join thousands breaking language barriers
                </p>
              </motion.div>

              {/* Free Minutes Offer Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20 border-2 border-emerald-200 dark:border-emerald-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-1">
                      Welcome Bonus: 60 Free Minutes
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      Experience real-time voice translation immediately. No credit card required. Your free minutes never expire.
                    </p>
                  </div>
                </div>
              </motion.div>

              <form onSubmit={handleSendCode} className="space-y-6">
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
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 px-4 text-base font-medium bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                    data-testid="input-password"
                  />
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pt-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Password strength</span>
                        <span className={`font-bold ${
                          passwordStrength.score === 1 ? 'text-red-600 dark:text-red-400' :
                          passwordStrength.score === 2 ? 'text-orange-600 dark:text-orange-400' :
                          passwordStrength.score === 3 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
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
                  className="space-y-3"
                >
                  <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 px-4 text-base font-medium bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                    data-testid="input-confirm-password"
                  />
                  {confirmPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 text-sm pt-1"
                    >
                      {password === confirmPassword ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-semibold">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400 font-semibold">Passwords don't match</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    disabled={isLoading}
                    data-testid="button-create-account"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
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
                  className="text-center pt-2"
                >
                  <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                    Already have an account?{" "}
                    <Link 
                      href="/login" 
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline decoration-2 underline-offset-2 transition-colors"
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
