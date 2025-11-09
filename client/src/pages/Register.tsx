import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PricingCards } from "@/components/PricingCards";
import { useToast } from "@/hooks/use-toast";
import { Languages, Check, ArrowRight, ArrowLeft, Mail, Lock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const PLAN_NAMES = {
  free: "Free Trial",
  starter: "Starter",
  pro: "Pro"
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleNext = () => {
    if (step === 1 && !selectedPlan) {
      toast({
        title: "Plan required",
        description: "Please select a plan to continue",
        variant: "destructive",
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

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
      await register(email, password, confirmPassword, selectedPlan);
      setStep(3);
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

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logo and Progress */}
        <div className="text-center space-y-6 mb-8 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-in zoom-in duration-700">
              <Languages className="h-9 w-9 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {step === 1 && "Choose the perfect plan for your needs"}
              {step === 2 && "Just a few details to get started"}
              {step === 3 && "Welcome to Voztra! 🎉"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span className={cn(step >= 1 && "text-primary")}>Select Plan</span>
              <span className={cn(step >= 2 && "text-primary")}>Create Account</span>
              <span className={cn(step >= 3 && "text-primary")}>Done</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <PricingCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />
            
            <div className="flex justify-center gap-4">
              <Link href="/login">
                <Button variant="outline" size="lg" data-testid="button-back-to-login">
                  Back to Login
                </Button>
              </Link>
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 min-w-[200px]"
                data-testid="button-next-step"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <Card className="max-w-lg mx-auto animate-in fade-in slide-in-from-right duration-500" data-testid="card-account-details">
            <CardContent className="p-8 space-y-6">
              {/* Selected Plan Summary */}
              <div className="p-4 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Selected Plan</p>
                      <p className="text-lg font-bold">{PLAN_NAMES[selectedPlan as keyof typeof PLAN_NAMES]}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    data-testid="button-change-plan"
                  >
                    Change
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
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
                    className="h-12"
                    data-testid="input-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12"
                    data-testid="input-confirm-password"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
                    data-testid="button-create-account"
                  >
                    {isLoading ? (
                      "Creating..."
                    ) : (
                      <>
                        Create Account
                        <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <p className="text-sm text-center text-muted-foreground pt-4 border-t">
                Already have an account?{" "}
                <Link href="/login">
                  <a className="text-primary hover:underline font-medium" data-testid="link-login">
                    Sign in
                  </a>
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="max-w-lg mx-auto animate-in fade-in zoom-in duration-500" data-testid="card-success">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 animate-in zoom-in duration-700 delay-150">
                  <Check className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Welcome to Voztra!</h2>
                <p className="text-muted-foreground text-lg">
                  Your account has been created successfully
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 dark:bg-primary/20 space-y-2">
                <p className="text-sm font-medium">Account Details</p>
                <p className="text-lg font-bold">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Plan: {PLAN_NAMES[selectedPlan as keyof typeof PLAN_NAMES]}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                Redirecting to home page...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
