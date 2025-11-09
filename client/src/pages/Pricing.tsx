import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    credits: 60,
    minutes: "60",
    icon: Sparkles,
    description: "Perfect for trying out Voztra",
    features: [
      "60 minutes of translation",
      "47 languages supported",
      "94 neural voices",
      "Real-time translation",
      "Basic support"
    ],
    gradient: "from-slate-500 to-slate-600",
    buttonVariant: "outline" as const
  },
  {
    id: "starter",
    name: "Starter",
    price: "$9.99",
    credits: 21000,
    minutes: "350",
    icon: Zap,
    description: "Great for regular users",
    features: [
      "350 minutes of translation",
      "47 languages supported",
      "94 premium neural voices",
      "Real-time translation",
      "Priority support",
      "Credits rollover"
    ],
    gradient: "from-primary to-indigo-600",
    popular: true,
    buttonVariant: "default" as const
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29.99",
    credits: 72000,
    minutes: "1200",
    icon: Crown,
    description: "Best for power users",
    features: [
      "1200 minutes of translation",
      "47 languages supported",
      "94 premium neural voices",
      "Real-time translation",
      "Premium support",
      "Credits rollover",
      "Early access to new features"
    ],
    gradient: "from-violet-500 to-purple-600",
    buttonVariant: "default" as const
  }
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user, subscription } = useAuth();
  const { toast } = useToast();

  const selectPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error("Invalid plan");

      const response = await apiRequest("POST", "/api/subscription", {
        plan: planId,
        creditsRemaining: plan.credits
      });
      return await response.json();
    },
    onSuccess: (data, planId) => {
      const plan = plans.find(p => p.id === planId);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Plan Selected!",
        description: `You've successfully selected the ${plan?.name} plan.`,
      });
      setTimeout(() => setLocation("/"), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Selection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      setLocation("/register");
      return;
    }

    if (subscription && subscription.plan === planId) {
      toast({
        title: "Already Subscribed",
        description: "You're already on this plan.",
      });
      return;
    }

    selectPlanMutation.mutate(planId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-violet-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950 dark:to-violet-950">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with 60 free minutes. Upgrade anytime to continue breaking down language barriers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  plan.popular
                    ? 'border-primary shadow-2xl shadow-primary/20 scale-105'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.id !== 'free' && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {plan.minutes} minutes included
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3" data-testid={`feature-${plan.id}-${idx}`}>
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20'
                      : ''
                  }`}
                  variant={plan.buttonVariant}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || selectPlanMutation.isPending}
                  data-testid={`button-select-${plan.id}`}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : selectPlanMutation.isPending
                    ? "Selecting..."
                    : user
                    ? "Select Plan"
                    : "Get Started"}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>All plans include access to 47 languages and 94 premium neural voices.</p>
          <p className="mt-2">Unused credits roll over to the next month on paid plans.</p>
        </div>
      </div>
    </div>
  );
}
