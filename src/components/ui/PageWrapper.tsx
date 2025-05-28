
import React from 'react';
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const PageWrapper = ({ children, className }: PageWrapperProps) => {
  return (
    <div className={cn(
      "min-h-screen w-full bg-gradient-to-b from-game-primary/5 via-game-secondary/5 to-game-background",
      "animate-fade-in",
      className
    )}>
      {children}
    </div>
  );
};

export default PageWrapper;
