import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { User as UserIcon, CreditCard, Clock, LogOut, ExternalLink, Zap, Mail, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Subscription } from "@shared/schema";

type AuthMeResponse = {
  user: User;
  subscription: Subscription | null;
};

function AccountContent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [isManaging, setIsManaging] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { 
    data: authData, 
    isLoading,
    error,
    refetch
  } = useQuery<AuthMeResponse>({
    queryKey: ["/api/auth/me"],
  });

  const user = authData?.user;
  const subscription = authData?.subscription;

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/resend-verification", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent!",
        description: "Please check your inbox for the verification link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-billing-portal-session", {});
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "No billing portal URL received. Please try again.",
          variant: "destructive",
        });
        setIsManaging(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
      setIsManaging(false);
    },
    onSettled: () => {
      setTimeout(() => setIsManaging(false), 1000);
    },
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Clear React Query cache
      queryClient.clear();
      // Use AuthContext logout which clears user/subscription state and redirects
      await logout();
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
        variant: "success",
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleManageSubscription = () => {
    if (subscription?.plan === "free") {
      navigate("/pricing");
      return;
    }
    setIsManaging(true);
    billingPortalMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Error state: no subscription data and not loading
  if (!subscription && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Unable to Load Account</CardTitle>
            <CardDescription>
              We're having trouble loading your account details. This is usually a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Error Details:
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {(error as Error).message}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Try these steps:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Click "Retry" to reload your account data</li>
                <li>If that doesn't work, refresh your browser</li>
                <li>Check your internet connection</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => refetch()} 
                variant="default"
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                data-testid="button-retry"
              >
                Retry
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                data-testid="button-refresh"
              >
                Refresh Browser
              </Button>
            </div>
            <div className="text-center pt-2">
              <Button 
                onClick={() => navigate("/")} 
                variant="ghost"
                className="text-xs"
                data-testid="button-home"
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TypeScript guard: At this point, subscription must exist
  if (!subscription) {
    return null;
  }

  const planNames = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
  };

  const planColors = {
    free: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    starter: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    pro: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const minutesRemaining = Math.floor(subscription.creditsRemaining / 60);
  const isLowCredits = minutesRemaining < 10;
  const isPaidPlan = subscription.plan !== "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent" data-testid="heading-account">
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-2">Manage your account and subscription</p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Log Out"}
          </Button>
        </div>

        {/* Email Verification Banner */}
        {user && !user.isEmailVerified && (
          <Card className="border-amber-500/50 bg-amber-500/5 backdrop-blur-sm" data-testid="card-verification-warning">
            <CardContent className="flex items-start gap-4 pt-6">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-400 mb-1">Email Verification Required</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Please verify your email address to create translation rooms. Check your inbox for the verification link.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendVerificationMutation.mutate()}
                  disabled={resendVerificationMutation.isPending}
                  className="border-amber-500/50 hover:bg-amber-500/10"
                  data-testid="button-resend-verification"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {resendVerificationMutation.isPending ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-profile" className="border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-violet-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium" data-testid="text-email">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-subscription" className="border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-violet-400" />
              Subscription & Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Current Plan</span>
              <Badge className={planColors[subscription.plan]} data-testid="badge-plan">
                {planNames[subscription.plan]}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-400" />
                Minutes Remaining
              </span>
              <span className={`text-3xl font-bold ${isLowCredits ? 'text-red-400' : 'text-violet-400'}`} data-testid="text-minutes-remaining">
                {minutesRemaining}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={subscription.isActive ? "default" : "secondary"} data-testid="badge-status">
                {subscription.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {subscription.billingCycleEnd && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {isPaidPlan ? "Next Billing Date" : "No Expiration"}
                </span>
                <span className="font-medium" data-testid="text-billing-cycle-end">
                  {isPaidPlan 
                    ? format(new Date(subscription.billingCycleEnd), "MMM dd, yyyy")
                    : "Lifetime"
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              {isPaidPlan 
                ? "Update your payment method, change plans, or cancel your subscription"
                : "Upgrade to a paid plan for more translation minutes"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleManageSubscription} 
                disabled={isManaging}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                data-testid="button-manage-subscription"
              >
                {isManaging ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Opening...
                  </span>
                ) : (
                  <>
                    {isPaidPlan ? "Manage Subscription" : "Upgrade Plan"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              {!isPaidPlan && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/pricing")}
                  data-testid="button-view-plans"
                >
                  View All Plans
                </Button>
              )}
            </div>

            {isPaidPlan && (
              <p className="text-xs text-muted-foreground">
                You'll be redirected to Stripe's secure billing portal to manage your subscription
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
            <CardDescription>Coming soon - track your translation usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Usage tracking and detailed analytics will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Account() {
  return <AccountContent />;
}
