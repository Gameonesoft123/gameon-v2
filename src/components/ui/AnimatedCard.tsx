
import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
}

const AnimatedCard = ({ children, className, delay = 0, ...props }: AnimatedCardProps) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden backdrop-blur-sm border-border/50",
        "transform transition-all duration-500 ease-out",
        "hover:shadow-lg hover:shadow-game-primary/20 hover:border-game-primary/50",
        "animate-fade-in opacity-0 translate-y-4",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards' 
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default AnimatedCard;
