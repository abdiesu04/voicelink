import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        plan,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Unable to start checkout",
          description: "Please try again or contact support if the problem continues.",
          variant: "destructive",
        });
        setSelectedPlan(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Unable to start checkout",
        description: "Please try again or contact support if the problem continues.",
        variant: "destructive",
      });
      setSelectedPlan(null);
    },
    onSettled: () => {
      setTimeout(() => setSelectedPlan(null), 1000);
    },
  });

  const handleUpgrade = (plan: "starter" | "pro") => {
    setSelectedPlan(plan);
    checkoutMutation.mutate(plan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-3xl border-border/50 backdrop-blur-xl bg-gradient-to-br from-background/95 via-background/90 to-background/95"
        data-testid="dialog-upgrade-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Out of Minutes
          </DialogTitle>
          <DialogDescription className="text-base">
            You've used all your translation minutes. Upgrade to continue translating.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Starter Plan */}
          <Card className="border-violet-500/20 hover:border-violet-500/40 transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-6 w-6 text-violet-400" />
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                  Popular
                </Badge>
              </div>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Perfect for regular users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">350 minutes per month</p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <span className="text-sm">350 minutes monthly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Premium voice quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <span className="text-sm">47+ languages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Real-time translation</span>
                </li>
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                onClick={() => handleUpgrade("starter")}
                disabled={checkoutMutation.isPending}
                data-testid="button-upgrade-starter"
              >
                {selectedPlan === "starter" && checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upgrade to Starter"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Crown className="h-6 w-6 text-amber-400" />
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Best Value
                </Badge>
              </div>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For power users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$29.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">1200 minutes per month</p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">1200 minutes monthly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Premium voice quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">47+ languages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Real-time translation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={() => handleUpgrade("pro")}
                disabled={checkoutMutation.isPending}
                data-testid="button-upgrade-pro"
              >
                {selectedPlan === "pro" && checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upgrade to Pro"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
