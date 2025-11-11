import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, Subscription } from "@shared/schema";

type AuthMeResponse = {
  user: User;
  subscription: Subscription | null;
};

interface PricingTier {
  name: string;
  price: string;
  description: string;
  credits: string;
  resetPeriod: string;
  features: string[];
  cta: string;
  popular?: boolean;
  icon: typeof Gift;
  plan: "free" | "starter" | "pro";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with voice translation",
    credits: "60 minutes",
    resetPeriod: "Lifetime allocation",
    features: [
      "60 minutes total usage",
      "47+ supported languages",
      "Premium neural voices",
      "Real-time translation",
      "No credit card required",
      "Perfect for trying Voztra"
    ],
    cta: "Get Started Free",
    icon: Gift,
    plan: "free"
  },
  {
    name: "Starter",
    price: "$9.99",
    description: "For regular translators",
    credits: "350 minutes",
    resetPeriod: "Monthly reset",
    features: [
      "350 minutes per month",
      "47+ supported languages",
      "Premium neural voices",
      "Real-time translation",
      "Priority support",
      "Monthly credit reset",
      "Cancel anytime"
    ],
    cta: "Subscribe to Starter",
    popular: true,
    icon: Zap,
    plan: "starter"
  },
  {
    name: "Pro",
    price: "$29.99",
    description: "For power users and teams",
    credits: "1,200 minutes",
    resetPeriod: "Monthly reset",
    features: [
      "1,200 minutes per month",
      "47+ supported languages",
      "Premium neural voices",
      "Real-time translation",
      "Priority support",
      "Monthly credit reset",
      "Team features (coming soon)",
      "API access (coming soon)"
    ],
    cta: "Subscribe to Pro",
    icon: Crown,
    plan: "pro"
  }
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: authData } = useQuery<AuthMeResponse>({
    queryKey: ["/api/auth/me"],
  });

  const user = authData?.user;
  const subscription = authData?.subscription;

  const checkoutMutation = useMutation({
    mutationFn: async (plan: "starter" | "pro") => {
      const response = await apiRequest("POST", "/api/create-checkout-session", { plan });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    },
  });

  const handleSubscribe = async (plan: "free" | "starter" | "pro") => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (plan === "free") {
      navigate("/");
      return;
    }

    setLoadingPlan(plan);
    checkoutMutation.mutate(plan);
  };

  const getCurrentPlan = () => subscription?.plan || "free";
  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20" data-testid="badge-pricing">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent" data-testid="heading-pricing">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-description">
            Start with our free tier or upgrade for more translation minutes. 
            All plans include premium neural voices and real-time translation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentPlan = currentPlan === tier.plan;
            const isDisabled = loadingPlan !== null;
            const isLoading = loadingPlan === tier.plan;

            return (
              <Card 
                key={tier.name}
                className={`
                  relative overflow-hidden backdrop-blur-sm
                  ${tier.popular 
                    ? 'border-2 border-violet-500/50 shadow-xl shadow-violet-500/10 dark:shadow-violet-500/20 scale-105' 
                    : 'border-border/50 hover:border-border'
                  }
                  ${isCurrentPlan ? 'ring-2 ring-green-500/50' : ''}
                  transition-all duration-300 hover:shadow-lg
                `}
                data-testid={`card-plan-${tier.plan}`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg" data-testid="badge-popular">
                    Most Popular
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-sm font-semibold rounded-br-lg" data-testid={`badge-current-${tier.plan}`}>
                    Current Plan
                  </div>
                )}

                <CardHeader className="space-y-4 pt-8">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                    tier.plan === 'free' ? 'from-blue-500/20 to-cyan-500/20' :
                    tier.plan === 'starter' ? 'from-violet-500/20 to-purple-500/20' :
                    'from-amber-500/20 to-orange-500/20'
                  } flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${
                      tier.plan === 'free' ? 'text-cyan-400' :
                      tier.plan === 'starter' ? 'text-violet-400' :
                      'text-amber-400'
                    }`} />
                  </div>
                  
                  <div>
                    <CardTitle className="text-2xl" data-testid={`text-plan-name-${tier.plan}`}>{tier.name}</CardTitle>
                    <CardDescription data-testid={`text-plan-description-${tier.plan}`}>{tier.description}</CardDescription>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold" data-testid={`text-price-${tier.plan}`}>{tier.price}</span>
                      {tier.plan !== "free" && <span className="text-muted-foreground">/month</span>}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-semibold text-violet-400" data-testid={`text-credits-${tier.plan}`}>
                        {tier.credits}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-reset-${tier.plan}`}>
                        {tier.resetPeriod}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2" data-testid={`feature-${tier.plan}-${index}`}>
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`
                      w-full
                      ${tier.popular 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white' 
                        : tier.plan === 'pro'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : ''
                      }
                      ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => handleSubscribe(tier.plan)}
                    disabled={isCurrentPlan || isDisabled}
                    data-testid={`button-subscribe-${tier.plan}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      tier.cta
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-faq">
            Have questions? Need a custom plan for your organization?
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/contact")}
            className="border-border/50 hover:border-violet-500/50"
            data-testid="button-contact"
          >
            Contact Us
          </Button>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-violet-400" data-testid="text-stat-languages">47+</div>
              <div className="text-sm text-muted-foreground">Supported Languages</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-violet-400" data-testid="text-stat-voices">Premium</div>
              <div className="text-sm text-muted-foreground">Neural Voices</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-violet-400" data-testid="text-stat-realtime">Real-time</div>
              <div className="text-sm text-muted-foreground">Translation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
