
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gamepad2, Edit2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import MachineDialog from '@/components/machines/MachineDialog';
import CashRecordDialog from '@/components/machines/CashRecordDialog';
import MachineHistory from '@/components/machines/MachineHistory';
import { supabase } from '@/integrations/supabase/client';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Machines: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hasMachines, setHasMachines] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [machines, setMachines] = useState<any[]>([]);

  // Check if any machines exist and fetch machines
  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setMachines(data || []);
      setHasMachines(data !== null && data.length > 0);
    } catch (error) {
      console.error('Error checking machines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Machines">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Track and manage your game machines</p>
          </div>
          <div className="flex gap-2">
            <CashRecordDialog trigger={
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                Record Cash
              </button>
            } />
            <MachineDialog onSuccess={fetchMachines} />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Alert>
              <Gamepad2 className="h-4 w-4" />
              <AlertTitle>Machine Management</AlertTitle>
              <AlertDescription>
                This page will allow you to track machine performance, maintenance history, 
                and daily cash for each game machine in your facility.
              </AlertDescription>
            </Alert>
            
            {!loading && !hasMachines && (
              <div className="bg-card rounded-lg border border-border p-6 text-center">
                <Gamepad2 size={64} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Machine Inventory</h3>
                <p className="text-muted-foreground mb-4">
                  Your machine management system is ready to be configured. Add your first machine to get started.
                </p>
                <MachineDialog 
                  isSampleMachine={true}
                  onSuccess={fetchMachines}
                  trigger={
                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Gamepad2 size={16} className="mr-2" />
                      Add Sample Machines
                    </button>
                  } 
                />
              </div>
            )}
            
            {!loading && hasMachines && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {machines.map(machine => (
                  <Card key={machine.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{machine.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <span className={`text-sm font-medium ${
                            machine.status === 'active' ? 'text-green-600' : 
                            machine.status === 'maintenance' ? 'text-red-500' : 'text-orange-500'
                          }`}>
                            {machine.status && machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                          </span>
                        </div>
                        {machine.location && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Location:</span>
                            <span className="text-sm">{machine.location}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Added:</span>
                          <span className="text-sm">
                            {new Date(machine.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {machine.description && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">{machine.description}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <MachineDialog
                        machine={machine}
                        onSuccess={fetchMachines}
                        isEdit={true}
                        trigger={
                          <Button variant="outline" size="sm" className="ml-auto">
                            <Edit2 size={14} className="mr-1" /> Edit
                          </Button>
                        }
                      />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <MachineHistory />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Machines;
