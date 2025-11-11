import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export function GlassCard({ children, className, animate = true, delay = 0 }: GlassCardProps) {
  const Card = animate ? motion.div : "div";
  
  return (
    <Card
      {...(animate && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay }
      })}
      className={cn(
        "backdrop-blur-xl bg-white/10 dark:bg-black/20",
        "border border-white/20 dark:border-white/10",
        "rounded-2xl shadow-2xl",
        "hover:bg-white/15 dark:hover:bg-black/25",
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </Card>
  );
}
