
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string; // Added this missing prop
  trend?: number;
  trendLabel?: string;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description, // Added this to the function parameters
  trend,
  trendLabel = 'vs. last period',
  colorScheme = 'default',
  className
}) => {
  const colorClasses = {
    default: {
      bg: 'bg-card',
      iconBg: 'bg-game-primary bg-opacity-10',
      iconColor: 'text-game-primary',
      trendUp: 'text-game-success',
      trendDown: 'text-game-danger'
    },
    success: {
      bg: 'bg-game-success bg-opacity-10',
      iconBg: 'bg-game-success bg-opacity-20',
      iconColor: 'text-game-success',
      trendUp: 'text-game-success',
      trendDown: 'text-game-success'
    },
    warning: {
      bg: 'bg-game-warning bg-opacity-10',
      iconBg: 'bg-game-warning bg-opacity-20',
      iconColor: 'text-game-warning',
      trendUp: 'text-game-warning',
      trendDown: 'text-game-warning'
    },
    danger: {
      bg: 'bg-game-danger bg-opacity-10',
      iconBg: 'bg-game-danger bg-opacity-20',
      iconColor: 'text-game-danger',
      trendUp: 'text-game-danger',
      trendDown: 'text-game-danger'
    }
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className={cn(
      'rounded-xl border border-border p-4 shadow-sm',
      colors.bg,
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          
          {trend !== undefined && (
            <div className="flex items-center mt-1.5 text-xs">
              <span className={trend >= 0 ? colors.trendUp : colors.trendDown}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-muted-foreground ml-1">{trendLabel}</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'p-2.5 rounded-lg',
          colors.iconBg,
          colors.iconColor
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
