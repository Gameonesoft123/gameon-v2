
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IdCard, Search, X } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import BackupIDDialog from '@/components/backupid/BackupIDDialog';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface BackupID {
  id: string;
  card_id: string;
  created_at: string;
  notes: string | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

const BackupID: React.FC = () => {
  const [backupIDs, setBackupIDs] = useState<BackupID[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBackupIDs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('backup_ids')
        .select(`
          *,
          customer:customers(id, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Backup IDs loaded:", data?.length || 0);
      setBackupIDs(data || []);
    } catch (error) {
      console.error('Error fetching backup IDs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupIDs();
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredBackupIDs = backupIDs.filter(backupID => {
    if (!backupID.customer) return false;
    
    const customerName = `${backupID.customer.first_name} ${backupID.customer.last_name}`.toLowerCase();
    const cardId = backupID.card_id.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return customerName.includes(query) || cardId.includes(query);
  });

  return (
    <PageLayout title="Backup ID Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-muted-foreground">Manage RFID/NFC backup identification cards</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search cards..."
                className="pl-8 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            <BackupIDDialog onSuccess={fetchBackupIDs} />
          </div>
        </div>
        
        <Alert>
          <IdCard className="h-4 w-4" />
          <AlertTitle>Backup ID System</AlertTitle>
          <AlertDescription>
            This page allows you to issue and manage backup RFID/NFC cards for customers 
            when facial recognition may not be available or functional.
          </AlertDescription>
        </Alert>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : backupIDs.length > 0 ? (
          <div className="bg-card border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Card ID</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBackupIDs.map((backupID) => (
                  <TableRow key={backupID.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {backupID.customer && getInitials(backupID.customer.first_name, backupID.customer.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {backupID.customer && `${backupID.customer.first_name} ${backupID.customer.last_name}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {backupID.customer && backupID.customer.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {backupID.card_id}
                    </TableCell>
                    <TableCell>
                      {format(new Date(backupID.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">
                      {backupID.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <IdCard size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Backup ID Cards</h3>
            <p className="text-muted-foreground mb-4">
              Your backup ID management system is ready to use. Issue your first card to get started.
            </p>
            <BackupIDDialog 
              onSuccess={fetchBackupIDs}
              trigger={
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                  <IdCard size={16} className="mr-2" />
                  Issue First Card
                </button>
              } 
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BackupID;
