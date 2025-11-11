import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User, Subscription } from "@shared/schema";

type AuthMeResponse = {
  user: User;
  subscription: Subscription | null;
};

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(5);

  const { data: authData } = useQuery<AuthMeResponse>({
    queryKey: ["/api/auth/me"],
  });

  const user = authData?.user;

  useEffect(() => {
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
  }, [navigate]);

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
              Payment Successful!
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
