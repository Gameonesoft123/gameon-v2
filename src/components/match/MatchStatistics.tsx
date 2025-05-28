
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, BadgePercent, CreditCard, Clock } from 'lucide-react';

interface MatchStatisticsProps {
  stats: {
    totalCash: number;
    totalMatched: number;
    totalCredits: number;
    activeMatches: number;
  };
}

const MatchStatistics: React.FC<MatchStatisticsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Cash Deposits</p>
              <h4 className="text-2xl font-bold">${stats.totalCash.toFixed(2)}</h4>
            </div>
            <div className="p-2 bg-blue-100 rounded-md">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Matched Credits</p>
              <h4 className="text-2xl font-bold">${stats.totalMatched.toFixed(2)}</h4>
            </div>
            <div className="p-2 bg-green-100 rounded-md">
              <BadgePercent className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Credits</p>
              <h4 className="text-2xl font-bold">${stats.totalCredits.toFixed(2)}</h4>
            </div>
            <div className="p-2 bg-purple-100 rounded-md">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Matches</p>
              <h4 className="text-2xl font-bold">{stats.activeMatches}</h4>
            </div>
            <div className="p-2 bg-amber-100 rounded-md">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchStatistics;
