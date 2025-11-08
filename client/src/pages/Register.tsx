import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingCards } from "@/components/PricingCards";
import { useToast } from "@/hooks/use-toast";
import { Languages } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(email, password, confirmPassword, selectedPlan);
      toast({
        title: "Account created!",
        description: "Welcome to Voztra. You can now start translating conversations.",
      });
      setLocation("/create");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Languages className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Create Your Account</h1>
          <p className="text-muted-foreground text-lg">Choose a plan and start breaking language barriers</p>
        </div>

        <PricingCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />

        <Card className="max-w-md mx-auto" data-testid="card-register">
          <CardHeader>
            <CardTitle>Complete Registration</CardTitle>
            <CardDescription>Create your account to get started</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selected plan: <span className="font-medium text-foreground">{selectedPlan === "free" ? "Free Trial" : selectedPlan === "starter" ? "Starter" : "Pro"}</span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-indigo-600"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login">
                  <a className="text-primary hover:underline font-medium" data-testid="link-login">
                    Sign in
                  </a>
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
