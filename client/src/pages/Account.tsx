import { useAuth, RequireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Clock, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";

function AccountContent() {
  const { user, subscription, logout, refreshUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    refreshUser();
  }, []);

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Subscription Found</CardTitle>
            <CardDescription>Please contact support if you believe this is an error.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const planNames = {
    free: "Free Trial",
    starter: "Starter",
    pro: "Pro",
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account and subscription</p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>

        <Card data-testid="card-profile">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-sm">{user?.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-subscription">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription & Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Current Plan</span>
              <Badge variant="default" className="text-sm">
                {planNames[subscription.plan as keyof typeof planNames]}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Credits Remaining</span>
              <span className="text-2xl font-bold text-primary">
                {(subscription.creditsRemaining / 60).toFixed(1)} minutes
              </span>
            </div>

            {subscription.creditsRolledOver > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Rollover Credits</span>
                <span className="font-medium">{(subscription.creditsRolledOver / 60).toFixed(1)} minutes</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={subscription.isActive ? "default" : "secondary"}>
                {subscription.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {subscription.billingCycleEnd && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Billing Cycle Ends
                </span>
                <span className="font-medium">
                  {format(new Date(subscription.billingCycleEnd), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Management</CardTitle>
            <CardDescription>
              Manage your subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Want to upgrade your plan for more credits? Stripe integration coming soon!
            </p>
            <Button variant="outline" disabled data-testid="button-manage-plan">
              Manage Plan (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Account() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
