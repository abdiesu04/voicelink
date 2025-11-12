import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { VoztraLogo } from "@/components/VoztraLogo";
import { useToast } from "@/hooks/use-toast";

export default function ResendVerification() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        toast({
          title: "Email Sent!",
          description: "Please check your inbox for the verification link",
        });
      } else {
        toast({
          title: "Failed to Send",
          description: data.error || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md" data-testid="card-resend-success">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <VoztraLogo />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a new verification link to your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 py-8" data-testid="status-success">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium">Verification Email Sent!</p>
                <p className="text-sm text-muted-foreground">
                  Check your inbox at <span className="font-semibold" data-testid="text-email">{email}</span>
                </p>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left">
                  <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-2">
                    Didn't receive the email?
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Check your spam or junk folder</li>
                    <li>Wait a few minutes for delivery</li>
                    <li>Make sure you entered the correct email</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button 
                  onClick={() => setLocation('/')} 
                  className="w-full"
                  data-testid="button-goto-home"
                >
                  Go to Home
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowSuccess(false)} 
                  className="w-full"
                  data-testid="button-send-again"
                >
                  Send to Different Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4 pt-24">
      <Card className="w-full max-w-md" data-testid="card-resend-verification">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <VoztraLogo />
          </div>
          <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
          <CardDescription>
            Enter your email to receive a new verification link
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Why verify your email?</p>
                  <p>
                    Email verification protects your free 60-minute credit and ensures 
                    secure access to all translation features.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Email
                </>
              )}
            </Button>

            <Button 
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setLocation('/')}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
