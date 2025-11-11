import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Loader2, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Subscription } from "@shared/schema";

type AuthMeResponse = {
  user: User;
  subscription: Subscription | null;
};

type ActivationStatus = 'verifying' | 'waiting_webhook' | 'activated' | 'timeout';

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>('verifying');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // Get session_id from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');

  const { data: authData, refetch: refetchAuth } = useQuery<AuthMeResponse>({
    queryKey: ["/api/auth/me"],
  });

  const user = authData?.user;
  const subscription = authData?.subscription;

  // Verify payment and activate subscription (development only, production uses webhooks)
  const verifyMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("POST", "/api/payments/verify", { sessionId });
      
      // Handle 403 as expected in production (webhooks handle activation)
      if (response.status === 403) {
        return { production: true, success: true };
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Payment verification failed");
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.production) {
        // Production: webhooks will handle activation - start polling
        console.log("[Payment] Production mode - waiting for webhook activation");
        setActivationStatus('waiting_webhook');
      } else {
        // Development: manual verification activated subscription
        console.log("[Payment] Subscription activated via verification endpoint");
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        await refetchAuth();
        setActivationStatus('activated');
      }
    },
    onError: (error: any) => {
      console.error("[Payment] Verification failed:", error);
      toast({
        title: "Payment Processing",
        description: "Your payment was successful. Your subscription will be activated shortly.",
        variant: "default",
      });
      setActivationStatus('waiting_webhook');
    },
  });

  // Verify payment on mount ONCE (only when component loads)
  useEffect(() => {
    if (sessionId) {
      // Has session_id: trigger verification (runs once on mount)
      verifyMutation.mutate(sessionId);
    } else {
      // No session_id: derive status from actual subscription data
      if (subscription && subscription.plan !== 'free') {
        setActivationStatus('activated');
      } else {
        setActivationStatus('timeout'); // Show guidance to get proper redirect link
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Separate effect: Update activation status when subscription changes (no session_id case only)
  useEffect(() => {
    if (!sessionId && activationStatus === 'timeout') {
      // Re-evaluate if subscription upgraded while on timeout screen
      if (subscription && subscription.plan !== 'free') {
        setActivationStatus('activated');
      }
    }
  }, [subscription, sessionId, activationStatus]);

  // Poll for subscription activation in production (webhook-based)
  useEffect(() => {
    if (activationStatus !== 'waiting_webhook') return;

    const pollInterval = setInterval(async () => {
      setPollingAttempts(prev => prev + 1);
      
      // Timeout after 30 seconds (15 attempts * 2 seconds)
      if (pollingAttempts >= 15) {
        console.log("[Payment] Webhook timeout - activation may still complete");
        setActivationStatus('timeout');
        clearInterval(pollInterval);
        return;
      }

      // Refetch auth data to check subscription status
      const result = await refetchAuth();
      const currentPlan = result.data?.subscription?.plan;

      // Check if subscription upgraded from 'free' to paid tier
      if (currentPlan && currentPlan !== 'free') {
        console.log(`[Payment] Webhook activated subscription to ${currentPlan} plan`);
        setActivationStatus('activated');
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [activationStatus, pollingAttempts, refetchAuth]);

  useEffect(() => {
    if (activationStatus === 'activated') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/account");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activationStatus, navigate]);

  // Show verifying state
  if (activationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/50 backdrop-blur-xl bg-background/80 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-violet-500 animate-spin" data-testid="icon-verifying" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Processing Payment...
              </CardTitle>
              <CardDescription className="text-base">
                Please wait while we verify your payment
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Show waiting for webhook state (production only)
  if (activationStatus === 'waiting_webhook') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/50 backdrop-blur-xl bg-background/80 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Clock className="h-16 w-16 text-violet-500 animate-pulse" data-testid="icon-waiting" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Activating Subscription...
              </CardTitle>
              <CardDescription className="text-base">
                Your payment was successful! We're activating your subscription now.
                <br />
                <span className="text-xs text-muted-foreground mt-2 block">
                  This usually takes just a few seconds...
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for activation</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show timeout state (activation taking longer than expected OR no session_id)
  if (activationStatus === 'timeout') {
    const isActivated = subscription && subscription.plan !== 'free';
    const hasSessionId = !!sessionId;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/50 backdrop-blur-xl bg-background/80 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                {isActivated ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success-delayed" />
                ) : (
                  <Clock className="h-16 w-16 text-yellow-500" data-testid="icon-timeout" />
                )}
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {isActivated ? 'Subscription Activated!' : hasSessionId ? 'Activation Delayed' : 'Payment Status Unknown'}
              </CardTitle>
              <CardDescription className="text-base">
                {isActivated ? (
                  <>
                    Your subscription has been activated successfully!
                    <br />
                    <span className="text-sm text-green-500 mt-2 block">
                      Plan: {subscription.plan === 'starter' ? 'Starter' : 'Pro'}
                    </span>
                  </>
                ) : hasSessionId ? (
                  <>
                    Your payment was successful, but activation is taking longer than expected.
                    <br />
                    <span className="text-sm text-muted-foreground mt-2 block">
                      This usually happens due to high load. Please check your account page or try refreshing.
                    </span>
                  </>
                ) : (
                  <>
                    You reached this page without a valid payment session.
                    <br />
                    <span className="text-sm text-muted-foreground mt-2 block">
                      If you just completed a payment, please use the success link provided by Stripe, or check your account page.
                    </span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate("/account")}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  data-testid="button-check-account"
                >
                  {isActivated ? 'Go to Account' : 'Check Account Status'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!isActivated && hasSessionId && (
                  <Button
                    onClick={() => {
                      setActivationStatus('waiting_webhook');
                      setPollingAttempts(0);
                    }}
                    variant="outline"
                    data-testid="button-retry-activation"
                  >
                    <Loader2 className="mr-2 h-4 w-4" />
                    Retry Activation Check
                  </Button>
                )}
                {!isActivated && !hasSessionId && (
                  <Button
                    onClick={() => navigate("/pricing")}
                    variant="outline"
                    data-testid="button-view-pricing"
                  >
                    View Pricing Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
              {!isActivated && hasSessionId && (
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    If the issue persists, please contact support with your order details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 backdrop-blur-xl bg-background/80 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-3 border border-green-500/20">
                <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Subscription Activated!
            </CardTitle>
            <CardDescription className="text-base">
              Your subscription has been activated. Your translation minutes are now available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account</span>
                <span className="text-sm font-medium" data-testid="text-email">
                  {user?.email || "Loading..."}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-green-500" data-testid="text-status">
                  Active
                </span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting to your account in{" "}
                <span className="font-bold text-violet-400" data-testid="text-countdown">
                  {countdown}
                </span>{" "}
                seconds...
              </p>

              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                onClick={() => navigate("/account")}
                data-testid="button-go-to-account"
              >
                Go to Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full border-border/50"
                onClick={() => navigate("/")}
                data-testid="button-start-translating"
              >
                Start Translating
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
