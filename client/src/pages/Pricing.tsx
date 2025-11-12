import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Zap, Crown, Gift, Star, ChevronLeft, ChevronRight, Sparkles, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fadeInUp, staggerContainer, hoverLift } from "@/lib/motion-variants";
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
  highlight?: string;
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
      "140+ supported languages",
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
      "140+ supported languages",
      "Premium neural voices",
      "Real-time translation",
      "Priority support",
      "Monthly credit reset",
      "Cancel anytime"
    ],
    cta: "Subscribe to Starter",
    popular: true,
    icon: Zap,
    plan: "starter",
    highlight: "Best Value"
  },
  {
    name: "Pro",
    price: "$29.99",
    description: "For power users and teams",
    credits: "1,200 minutes",
    resetPeriod: "Monthly reset",
    features: [
      "1,200 minutes per month",
      "140+ supported languages",
      "Premium neural voices",
      "Real-time translation",
      "Priority support",
      "Monthly credit reset",
      "Team features (coming soon)",
      "API access (coming soon)"
    ],
    cta: "Subscribe to Pro",
    icon: Crown,
    plan: "pro",
    highlight: "Most Minutes"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "International Business Consultant",
    content: "Voztra has transformed how I communicate with clients. Real-time translation with natural voice makes meetings feel seamless.",
    rating: 5
  },
  {
    name: "Marco Rodriguez",
    role: "Language Educator",
    content: "The quality of neural voices is outstanding. My students love practicing conversations in different languages with preserved emotion.",
    rating: 5
  },
  {
    name: "Aisha Patel",
    role: "Remote Team Lead",
    content: "Managing a global team became so much easier. We can now have natural conversations without language being a barrier.",
    rating: 5
  }
];

const faqs = [
  {
    question: "How do translation minutes work?",
    answer: "Each minute of active translation is counted toward your monthly limit. The timer only runs when you're actively speaking and translating. Unused minutes don't roll over to the next month for paid plans."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes! You can cancel your subscription at any time from your account settings. You'll retain access to your plan benefits until the end of your current billing period."
  },
  {
    question: "What languages are supported?",
    answer: "Voztra supports 140+ languages with premium neural voices that preserve tone, emotion, and gender. We use Azure's advanced speech technology for the highest quality translations."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "We offer 60 free minutes for all new accounts to try Voztra. You can upgrade to a paid plan anytime to get more minutes and premium features."
  },
  {
    question: "How secure is my data?",
    answer: "Your privacy and security are our top priorities. All voice data is encrypted in transit and we don't store your audio recordings. We comply with GDPR and industry-standard security practices."
  }
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

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

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/20 dark:from-slate-950 dark:via-indigo-950/10 dark:to-slate-950">
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-3"
        >
          <Badge className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/20 dark:border-indigo-500/20 backdrop-blur-sm px-4 py-1.5" data-testid="badge-pricing">
            <Sparkles className="w-3 h-3 mr-2" />
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient" data-testid="heading-pricing">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto" data-testid="text-pricing-description">
            Start with our free tier or upgrade for more translation minutes. 
            All plans include premium neural voices and real-time translation.
          </p>
        </motion.div>

        {/* Bento Grid Pricing Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12"
        >
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const isCurrentPlan = currentPlan === tier.plan;
            const isDisabled = loadingPlan !== null;
            const isLoading = loadingPlan === tier.plan;

            return (
              <motion.div
                key={tier.name}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
                whileHover={tier.popular ? "hover" : undefined}
                initial="rest"
                className={tier.popular ? "md:scale-105" : ""}
              >
                <GlassCard
                  className={`
                    relative overflow-hidden h-full flex flex-col
                    ${tier.popular 
                      ? 'border-2 border-indigo-500/30 dark:border-indigo-400/30 shadow-2xl shadow-indigo-500/20' 
                      : ''
                    }
                    ${isCurrentPlan ? 'ring-2 ring-green-500/50' : ''}
                    hover:shadow-2xl transition-all duration-500
                  `}
                  data-testid={`card-plan-${tier.plan}`}
                  animate={false}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl shadow-lg"
                      data-testid="badge-popular"
                    >
                      {tier.highlight}
                    </motion.div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 text-xs font-bold rounded-br-xl shadow-lg"
                      data-testid={`badge-current-${tier.plan}`}
                    >
                      Current Plan
                    </motion.div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        tier.plan === 'free' ? 'from-blue-500/20 to-cyan-500/20' :
                        tier.plan === 'starter' ? 'from-indigo-500/20 to-violet-500/20' :
                        'from-amber-500/20 to-orange-500/20'
                      } flex items-center justify-center mb-4 backdrop-blur-sm`}
                    >
                      <Icon className={`w-6 h-6 ${
                        tier.plan === 'free' ? 'text-cyan-500 dark:text-cyan-400' :
                        tier.plan === 'starter' ? 'text-indigo-600 dark:text-indigo-400' :
                        'text-amber-500 dark:text-amber-400'
                      }`} />
                    </motion.div>
                    
                    {/* Plan Name & Description */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1" data-testid={`text-plan-name-${tier.plan}`}>
                        {tier.name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-xs" data-testid={`text-plan-description-${tier.plan}`}>
                        {tier.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white" data-testid={`text-price-${tier.plan}`}>
                          {tier.price}
                        </span>
                        {tier.plan !== "free" && (
                          <span className="text-sm text-slate-600 dark:text-slate-400">/mo</span>
                        )}
                      </div>
                      <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-200/20 dark:border-indigo-500/20">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400" data-testid={`text-credits-${tier.plan}`}>
                          {tier.credits}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5" data-testid={`text-reset-${tier.plan}`}>
                          {tier.resetPeriod}
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 flex-grow">
                      {tier.features.map((feature, featureIndex) => (
                        <motion.li
                          key={featureIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                          className="flex items-start gap-2"
                          data-testid={`feature-${tier.plan}-${featureIndex}`}
                        >
                          <Check className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-700 dark:text-slate-300">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`
                        w-full py-4 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300
                        ${tier.popular 
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white' 
                          : tier.plan === 'pro'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                          : 'bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-indigo-200 dark:border-indigo-500/20'
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
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Loved by Users Worldwide
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              See what our customers are saying about Voztra
            </p>
          </div>

          <GlassCard className="p-6 md:p-8 relative" data-testid="testimonial-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="text-center"
                data-testid={`testimonial-${testimonialIndex}`}
              >
                <div className="flex justify-center mb-3" data-testid="testimonial-rating">
                  {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 mb-4 italic" data-testid="testimonial-content">
                  "{testimonials[testimonialIndex].content}"
                </p>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white" data-testid="testimonial-name">
                    {testimonials[testimonialIndex].name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400" data-testid="testimonial-role">
                    {testimonials[testimonialIndex].role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="rounded-full bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
                data-testid="button-testimonial-prev"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="rounded-full bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
                data-testid="button-testimonial-next"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Everything you need to know about Voztra pricing
            </p>
          </div>

          <GlassCard className="p-6" data-testid="faq-section">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/10" data-testid={`faq-item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed" data-testid={`faq-answer-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-8 text-center">
            <GlassCard className="p-6">
              <div className="text-4xl font-bold text-gradient mb-2" data-testid="text-stat-languages">
                140+
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Supported Languages</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="text-4xl font-bold text-gradient mb-2" data-testid="text-stat-voices">
                Premium
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Neural Voices</div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="text-4xl font-bold text-gradient mb-2" data-testid="text-stat-realtime">
                Real-time
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Translation</div>
            </GlassCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
