import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Calendar, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import AnimatedCard from '@/components/ui/AnimatedCard';

type MachineData = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  revenue: number;
  performance: number;
  cashIn: number;
  cashOut: number;
  dailyStats: {
    date: string;
    cashIn: number;
    cashOut: number;
    revenue: number;
  }[];
};

const statusIcons = {
  active: <CheckCircle2 size={16} className="text-game-success" />,
  inactive: <Clock size={16} className="text-game-warning" />,
  maintenance: <AlertCircle size={16} className="text-game-danger" />
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance'
};

const statusColors = {
  active: 'text-game-success',
  inactive: 'text-game-warning',
  maintenance: 'text-game-danger'
};

const MachineStatus: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        
        const { data: machinesData, error: machinesError } = await supabase
          .from('machines')
          .select('*');
        
        if (machinesError) throw machinesError;
        
        if (!machinesData) {
          setMachines([]);
          return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: historyData, error: historyError } = await supabase
          .from('machine_history')
          .select('*')
          .gte('recorded_at', today.toISOString());
        
        if (historyError) throw historyError;
        
        const processedMachines: MachineData[] = await Promise.all(
          machinesData.map(async (machine) => {
            const machineHistory = historyData?.filter(record => record.machine_id === machine.id) || [];
            
            const cashIn = machineHistory.reduce((sum, record) => sum + Number(record.cash_in), 0);
            const cashOut = machineHistory.reduce((sum, record) => sum + Number(record.cash_out), 0);
            const revenue = machineHistory.reduce((sum, record) => sum + Number(record.revenue), 0);
            
            const performance = cashIn > 0 ? Math.min(Math.round((revenue / cashIn) * 100), 100) : 80;
            
            const { data: dailyData } = await supabase
              .from('machine_history')
              .select('*')
              .eq('machine_id', machine.id)
              .order('recorded_at', { ascending: false })
              .limit(3);
              
            const dailyStats = dailyData?.map(record => ({
              date: format(new Date(record.recorded_at), 'yyyy-MM-dd'),
              cashIn: Number(record.cash_in),
              cashOut: Number(record.cash_out),
              revenue: Number(record.revenue)
            })) || [];
              
            return {
              id: machine.id,
              name: machine.name,
              status: machine.status as 'active' | 'inactive' | 'maintenance',
              revenue,
              performance,
              cashIn,
              cashOut,
              dailyStats
            };
          })
        );
        
        setMachines(processedMachines);
      } catch (error) {
        console.error('Error fetching machines data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachines();
  }, []);

  const selectedMachineData = selectedMachine 
    ? machines.find(m => m.id === selectedMachine) 
    : null;

  const totalCashIn = machines
    .filter(machine => machine.status === 'active')
    .reduce((sum, machine) => sum + machine.cashIn, 0);
    
  const totalCashOut = machines
    .filter(machine => machine.status === 'active')
    .reduce((sum, machine) => sum + machine.cashOut, 0);
    
  const totalRevenue = totalCashIn - totalCashOut;

  return (
    <AnimatedCard className="col-span-1" delay={600}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Machine Status</CardTitle>
          <div className="flex items-center space-x-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'summary' | 'detailed')}>
              <TabsList className="h-8">
                <TabsTrigger value="summary" className="text-xs px-2 py-1">Summary</TabsTrigger>
                <TabsTrigger value="detailed" className="text-xs px-2 py-1">Detailed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Gamepad2 size={20} className="text-game-primary" />
          </div>
        </div>
        <div className="highlight-bar"></div>
        
        {viewMode === 'summary' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="border rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Cash In</p>
              <p className="text-sm font-semibold text-green-600">${totalCashIn}</p>
            </div>
            <div className="border rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Cash Out</p>
              <p className="text-sm font-semibold text-blue-600">${totalCashOut}</p>
            </div>
            <div className="border rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-sm font-semibold text-purple-600">${totalRevenue}</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-game-primary" />
          </div>
        ) : machines.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No machines found</p>
          </div>
        ) : selectedMachine && selectedMachineData ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedMachine(null)}
                className="text-xs"
              >
                ← Back to all machines
              </Button>
              <div className={`flex items-center ${statusColors[selectedMachineData.status]}`}>
                {statusIcons[selectedMachineData.status]}
                <span className="text-xs ml-1">
                  {statusLabels[selectedMachineData.status]}
                </span>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">{selectedMachineData.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {selectedMachineData.id}</p>
            </div>
            
            {selectedMachineData.status === 'active' && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <ArrowDownRight size={14} className="text-green-600 dark:text-green-400 mr-1" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Cash In</span>
                    </div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">${selectedMachineData.cashIn}</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <ArrowUpRight size={14} className="text-blue-600 dark:text-blue-400 mr-1" />
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Cash Out</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">${selectedMachineData.cashOut}</p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Revenue</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">${selectedMachineData.revenue}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Performance</span>
                    <span className="font-medium">{selectedMachineData.performance}%</span>
                  </div>
                  <Progress value={selectedMachineData.performance} className="h-1.5" 
                    style={{
                      backgroundColor: '#4A5568',
                      '--progress-background': selectedMachineData.performance > 85 ? '#48BB78' : selectedMachineData.performance > 70 ? '#ECC94B' : '#F56565'
                    } as React.CSSProperties}
                  />
                </div>
                
                {selectedMachineData.dailyStats.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Daily History</h4>
                      <Calendar size={14} className="text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-2">
                      {selectedMachineData.dailyStats.map((stat, index) => (
                        <div key={index} className="border rounded-md p-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium">{stat.date}</span>
                            <span className="text-xs font-semibold text-game-success">${stat.revenue}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">In:</span>
                              <span className="font-medium">${stat.cashIn}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Out:</span>
                              <span className="font-medium">${stat.cashOut}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {machines.map((machine, index) => (
              <div 
                key={machine.id} 
                className="border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-all hover:scale-[1.02] transform"
                onClick={() => setSelectedMachine(machine.id)}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{machine.name}</p>
                    <div className="flex items-center mt-1">
                      {statusIcons[machine.status]}
                      <span className={`text-xs ml-1 ${statusColors[machine.status]}`}>
                        {statusLabels[machine.status]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${machine.revenue}</p>
                    <p className="text-xs text-muted-foreground">Today's Revenue</p>
                  </div>
                </div>
                
                {machine.status === 'active' && viewMode === 'detailed' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Performance</span>
                      <span className="font-medium">{machine.performance}%</span>
                    </div>
                    <Progress value={machine.performance} className="h-1.5" 
                      style={{
                        backgroundColor: '#4A5568',
                        '--progress-background': machine.performance > 85 ? '#48BB78' : machine.performance > 70 ? '#ECC94B' : '#F56565'
                      } as React.CSSProperties}
                    />
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="flex items-center">
                          <ArrowDownRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mr-1.5" />
                          <span className="text-xs font-medium">Cash In</span>
                        </div>
                        <span className="text-xs font-bold">${machine.cashIn}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="flex items-center">
                          <ArrowUpRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mr-1.5" />
                          <span className="text-xs font-medium">Cash Out</span>
                        </div>
                        <span className="text-xs font-bold">${machine.cashOut}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {machine.status === 'active' && viewMode === 'summary' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Performance</span>
                      <span className="font-medium">{machine.performance}%</span>
                    </div>
                    <Progress value={machine.performance} className="h-1.5" 
                      style={{
                        backgroundColor: '#4A5568',
                        '--progress-background': machine.performance > 85 ? '#48BB78' : machine.performance > 70 ? '#ECC94B' : '#F56565'
                      } as React.CSSProperties}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

export default MachineStatus;
