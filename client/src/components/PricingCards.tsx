import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  rolloverLimit: number;
}

interface PricingCardsProps {
  selectedPlan?: string;
  onSelectPlan?: (planId: string) => void;
  showCTA?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    credits: 60,
    rolloverLimit: 0,
  },
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    credits: 350,
    rolloverLimit: 350,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    credits: 1200,
    rolloverLimit: 1200,
  },
];

const planFeatures = {
  free: [
    "60 minutes of translation",
    "96 languages",
    "Basic voice quality",
    "No rollover",
  ],
  starter: [
    "350 minutes per month",
    "96 languages",
    "Premium voice quality",
    "Up to 350 min rollover",
    "Priority support",
  ],
  pro: [
    "1,200 minutes per month",
    "96 languages",
    "Premium voice quality",
    "Up to 1,200 min rollover",
    "Priority support",
    "Advanced features",
  ],
};

export function PricingCards({ selectedPlan, onSelectPlan, showCTA = false }: PricingCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative transition-all duration-200",
            selectedPlan === plan.id && "ring-2 ring-primary shadow-lg scale-105",
            onSelectPlan && "cursor-pointer hover:shadow-lg hover:scale-102",
            plan.id === "pro" && "border-primary"
          )}
          onClick={() => onSelectPlan?.(plan.id)}
          data-testid={`pricing-card-${plan.id}`}
        >
          {plan.id === "pro" && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
          )}

          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  ${plan.price}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {plan.credits} {plan.credits === 1 ? "minute" : "minutes"}
              </div>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3">
              {planFeatures[plan.id as keyof typeof planFeatures].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          {showCTA && (
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.id === "pro" ? "default" : "outline"}
                data-testid={`button-select-${plan.id}`}
              >
                {plan.price === 0 ? "Start Free" : "Subscribe"}
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
