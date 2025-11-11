import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { VoztraLogo } from "@/components/VoztraLogo";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    const verifyEmail = async () => {
      // Extract token from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setVerificationState('invalid');
        setErrorMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setVerificationState('success');
          // Start countdown for redirect
          const interval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                setLocation('/');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setVerificationState('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setVerificationState('error');
        setErrorMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" data-testid="card-email-verification">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <VoztraLogo />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {verificationState === 'loading' && 'Verifying your email address...'}
            {verificationState === 'success' && 'Your email has been verified!'}
            {verificationState === 'error' && 'Verification failed'}
            {verificationState === 'invalid' && 'Invalid verification link'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Loading State */}
          {verificationState === 'loading' && (
            <div className="flex flex-col items-center space-y-4 py-8" data-testid="status-loading">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email...
              </p>
            </div>
          )}

          {/* Success State */}
          {verificationState === 'success' && (
            <div className="flex flex-col items-center space-y-4 py-8" data-testid="status-success">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium">Email verified successfully!</p>
                <p className="text-sm text-muted-foreground">
                  You can now access all translation features.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Redirecting to home in <span className="font-semibold text-primary" data-testid="text-countdown">{countdown}</span> seconds...
                </p>
              </div>
              <Button 
                onClick={() => setLocation('/')} 
                className="w-full mt-4"
                data-testid="button-goto-home"
              >
                Go to Home Now
              </Button>
            </div>
          )}

          {/* Error State */}
          {verificationState === 'error' && (
            <div className="flex flex-col items-center space-y-4 py-8" data-testid="status-error">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-red-600 dark:text-red-400">
                  Verification Failed
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-error-message">
                  {errorMessage}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This link may have expired or already been used.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button 
                  onClick={() => setLocation('/resend-verification')} 
                  className="w-full"
                  data-testid="button-resend"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Request New Verification Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/')} 
                  className="w-full"
                  data-testid="button-goto-home-error"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          )}

          {/* Invalid Token State */}
          {verificationState === 'invalid' && (
            <div className="flex flex-col items-center space-y-4 py-8" data-testid="status-invalid">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-4">
                <Mail className="h-16 w-16 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-orange-600 dark:text-orange-400">
                  Invalid Verification Link
                </p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Please use the verification link from your email.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button 
                  onClick={() => setLocation('/resend-verification')} 
                  className="w-full"
                  data-testid="button-resend-invalid"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Request Verification Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/')} 
                  className="w-full"
                  data-testid="button-goto-home-invalid"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
