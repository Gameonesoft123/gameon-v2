import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Clock, User, Calendar, Search, X, Gamepad2, ScanFace } from 'lucide-react';
import { toast } from "sonner";
import PageLayout from '@/components/layout/PageLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from '@/contexts/auth';
import CustomerFaceScanDialog from '@/components/check-in-out/CustomerFaceScanDialog';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  face_id: string | null;
}

interface CheckInRecord {
  id: string;
  customer_id: string;
  check_in_time: string;
  check_out_time: string | null;
  notes: string | null;
  customer: Customer;
}

interface BackupID {
  id: string;
  card_id: string;
  customer_id: string;
  customer?: Customer;
}

// Define interface for the check-in record from database to ensure type safety
interface CustomerCheckInRecord {
  id: string;
  customer_id: string;
  check_in_time: string;
  check_out_time: string | null;
  notes: string | null;
}

// Helper function to determine if an object is a CustomerCheckInRecord
const isCustomerCheckInRecord = (obj: any): obj is CustomerCheckInRecord => {
  return obj && typeof obj === 'object' && 'id' in obj && 'customer_id' in obj;
};

const CheckInOut: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchRFID, setSearchRFID] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeRecords, setActiveRecords] = useState<CheckInRecord[]>([]);
  const [recentRecords, setRecentRecords] = useState<CheckInRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoFocus, setAutoFocus] = useState(true);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [isFaceScanDialogOpen, setIsFaceScanDialogOpen] = useState(false);

  // Focus the RFID input field when the component mounts
  useEffect(() => {
    if (autoFocus && rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
  }, [autoFocus]);

  // Fetch active check-ins and recent check-outs
  const fetchCheckInRecords = async () => {
    try {
      setIsLoading(true);
      
      if (!currentUser?.store_id) {
        console.error('No store_id found for current user');
        toast.error("Store ID not found. Please update your profile first.");
        setIsLoading(false);
        return;
      }
      
      // Fetch active check-ins (where check_out_time is null)
      const { data: activeData, error: activeError } = await supabase
        .from('customer_check_ins')
        .select(`*, customer:customers(*)`)
        .eq('store_id', currentUser.store_id)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false });
      
      if (activeError) throw activeError;
      
      // Fetch recent check-outs (completed records)
      const { data: recentData, error: recentError } = await supabase
        .from('customer_check_ins')
        .select(`*, customer:customers(*)`)
        .eq('store_id', currentUser.store_id)
        .not('check_out_time', 'is', null)
        .order('check_out_time', { ascending: false })
        .limit(10);
      
      if (recentError) throw recentError;
      
      setActiveRecords(activeData as unknown as CheckInRecord[]);
      setRecentRecords(recentData as unknown as CheckInRecord[]);
    } catch (error) {
      console.error('Error fetching check-in records:', error);
      toast.error("Failed to load check-in records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.store_id) {
        fetchCheckInRecords();
    } else if (currentUser === null) { // User not loaded yet
        // Wait for user to load
    } else { // User loaded but no store_id
        toast.error("Store ID not found. Please ensure your profile is complete.");
        setIsLoading(false);
    }
    
    // Set up a real-time subscription to customer_check_ins table
    const channel = supabase
      .channel('customer_check_ins_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'customer_check_ins',
          filter: `store_id=eq.${currentUser?.store_id}` // Ensure we only listen for changes relevant to the current store
        }, 
        (payload) => {
          console.log('Realtime update received:', payload);
          fetchCheckInRecords();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to customer_check_ins changes!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error:', err);
          toast.error('Realtime connection error. Refresh may be needed.');
        }
        if (status === 'TIMED_OUT') {
          console.warn('Realtime connection timed out.');
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.store_id]);

  // Process RFID scan
  const handleRFIDScan = async (rfidCode: string) => {
    try {
      setSearchRFID('');
      
      if (!currentUser?.store_id) {
        toast.error("Store ID not found. Please update your profile first.");
        return;
      }
      
      const { data: backupIdData, error: backupIdError } = await supabase
        .from('backup_ids')
        .select('*, customer:customers(*)')
        .eq('card_id', rfidCode)
        .eq('store_id', currentUser.store_id)
        .single();
        
      if (backupIdError) {
        toast.error("RFID card not found in system for this store.");
        console.error("RFID Error:", backupIdError);
        return;
      }
      
      const backupId = backupIdData as BackupID;
      
      if (!backupId.customer) {
        toast.error("Customer not found for this RFID card");
        return;
      }
      
      const { data: existingCheckIn, error: checkInError } = await supabase
        .from('customer_check_ins')
        .select('*')
        .eq('customer_id', backupId.customer_id)
        .eq('store_id', currentUser.store_id)
        .is('check_out_time', null)
        .maybeSingle();
        
      if (checkInError && checkInError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine
        throw checkInError;
      }
      
      if (existingCheckIn && isCustomerCheckInRecord(existingCheckIn)) {
        const { error: updateError } = await supabase
          .from('customer_check_ins')
          .update({
            check_out_time: new Date().toISOString(),
            notes: 'Checked out via RFID'
          })
          .eq('id', existingCheckIn.id)
          .eq('store_id', currentUser.store_id);
          
        if (updateError) throw updateError;
        
        toast.success(`${backupId.customer.first_name} ${backupId.customer.last_name} has been checked out`);
      } else {
        const { error: insertError } = await supabase
          .from('customer_check_ins')
          .insert({
            customer_id: backupId.customer_id,
            check_in_time: new Date().toISOString(),
            notes: 'Checked in via RFID',
            store_id: currentUser.store_id
          });
          
        if (insertError) throw insertError;
        
        toast.success(`${backupId.customer.first_name} ${backupId.customer.last_name} has been checked in`);
      }
      
      fetchCheckInRecords();
      
    } catch (error) {
      console.error('Error processing RFID scan:', error);
      toast.error("Failed to process RFID scan");
    } finally {
      if (rfidInputRef.current) {
        rfidInputRef.current.focus();
      }
    }
  };

  const handleFaceDetectedForCheckInOut = async (faceId: string) => {
    if (!faceId) {
      toast.error("Face ID not provided.");
      return;
    }
    if (!currentUser?.store_id) {
      toast.error("Store ID not found. Cannot process facial recognition.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Find customer by faceId and store_id
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('face_id', faceId)
        .eq('store_id', currentUser.store_id)
        .single();

      if (customerError || !customerData) {
        console.error("Customer find error:", customerError);
        toast.error("Customer with this face not found in your store's records.");
        setIsLoading(false);
        return;
      }

      const customer = customerData as Customer;

      // 2. Check for existing active check-in for this customer
      const { data: existingCheckIn, error: checkInError } = await supabase
        .from('customer_check_ins')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('store_id', currentUser.store_id)
        .is('check_out_time', null)
        .maybeSingle();

      if (checkInError && checkInError.code !== 'PGRST116') { // PGRST116 means 0 rows
        throw checkInError;
      }

      if (existingCheckIn && isCustomerCheckInRecord(existingCheckIn)) {
        // Customer is already checked in, so check them out
        const { error: updateError } = await supabase
          .from('customer_check_ins')
          .update({
            check_out_time: new Date().toISOString(),
            notes: 'Checked out via Face Recognition'
          })
          .eq('id', existingCheckIn.id)
          .eq('store_id', currentUser.store_id);

        if (updateError) throw updateError;
        toast.success(`${customer.first_name} ${customer.last_name} has been checked out via face scan.`);
      } else {
        // Customer is not checked in, so check them in
        const { error: insertError } = await supabase
          .from('customer_check_ins')
          .insert({
            customer_id: customer.id,
            check_in_time: new Date().toISOString(),
            notes: 'Checked in via Face Recognition',
            store_id: currentUser.store_id
          });

        if (insertError) throw insertError;
        toast.success(`${customer.first_name} ${customer.last_name} has been checked in via face scan.`);
      }

      fetchCheckInRecords();
    } catch (error: any) {
      console.error('Error processing face scan check-in/out:', error);
      toast.error(error.message || "Failed to process face scan check-in/out.");
    } finally {
      setIsLoading(false);
      setIsFaceScanDialogOpen(false); // Close dialog regardless of outcome
      if (rfidInputRef.current) {
        rfidInputRef.current.focus(); // Re-focus RFID input
      }
    }
  };

  const handleCheckOut = async (recordId: string) => {
    try {
      if (!currentUser?.store_id) {
        toast.error("Store ID not found. Please update your profile first.");
        return;
      }
      
      const { error } = await supabase
        .from('customer_check_ins')
        .update({
          check_out_time: new Date().toISOString(),
          notes: 'Checked out manually'
        })
        .eq('id', recordId)
        .eq('store_id', currentUser.store_id);
        
      if (error) throw error;
      
      toast.success("Customer successfully checked out");
      fetchCheckInRecords();
    } catch (error) {
      console.error('Error checking out customer:', error);
      toast.error("Failed to check out customer");
    }
  };

  // Calculate duration of stay for display
  const calculateDuration = (checkInTime: string, checkOutTime: string | null) => {
    if (!checkOutTime) {
      return formatDistanceToNow(new Date(checkInTime), { addSuffix: false });
    } else {
      const start = new Date(checkInTime);
      const end = new Date(checkOutTime);
      const diffMs = end.getTime() - start.getTime();
      
      // Convert to hours and minutes
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }
  };
  
  const filteredActiveRecords = activeRecords.filter(record => {
    const customerName = `${record.customer.first_name} ${record.customer.last_name}`.toLowerCase();
    const customerPhone = record.customer.phone?.toLowerCase() || '';
    const searchTextLower = searchText.toLowerCase();
    return searchText === '' || customerName.includes(searchTextLower) || customerPhone.includes(searchTextLower);
  });
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <PageLayout title="Customer Check In/Out">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Customer Check In/Out</h1>
            <p className="text-muted-foreground">Track customer entry and exit times using RFID or Face Scan.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsFaceScanDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <ScanFace size={18} className="mr-2" />
              Scan Face
            </Button>
            <div className="relative w-full sm:w-72">
              <input
                ref={rfidInputRef}
                type="text"
                placeholder="Scan RFID card..."
                className="w-full px-4 py-2 border border-border rounded-md bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchRFID}
                onChange={(e) => setSearchRFID(e.target.value)}
                onBlur={() => setAutoFocus(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchRFID) {
                    handleRFIDScan(searchRFID);
                  }
                }}
                autoFocus={autoFocus}
                onFocus={() => setAutoFocus(false)}
              />
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-primary hover:text-primary/80"
                onClick={() => { if(searchRFID) handleRFIDScan(searchRFID)}}
                disabled={!searchRFID || isLoading}
              >
                <LogIn size={18} />
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center">
              <LogIn className="mr-2 h-4 w-4" />
              <span>Active Check-Ins ({filteredActiveRecords.length})</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Recent Check-Outs ({recentRecords.length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="pt-4">
            <div className="mb-4 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search active customers by name or phone..."
                  className="pl-8"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  disabled={isLoading}
                />
                {searchText && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setSearchText('')}
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
              <Card className="w-auto border-dashed hidden sm:block">
                <CardContent className="p-4 flex items-center">
                  <User className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-medium">{filteredActiveRecords.length}</span>
                  <span className="text-sm text-muted-foreground ml-1"> active</span>
                </CardContent>
              </Card>
            </div>
            
            {isLoading && activeRecords.length === 0 ? ( // Show loading spinner only if no records yet
              <div className="flex justify-center items-center h-60">
                <div role="status" className="flex flex-col items-center">
                    <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="sr-only">Loading...</span>
                    <p className="mt-2 text-sm text-muted-foreground">Loading active check-ins...</p>
                </div>
              </div>
            ) : filteredActiveRecords.length > 0 ? (
              <div className="bg-card border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] sm:w-[250px]">Customer</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead className="hidden md:table-cell">Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActiveRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(record.customer?.first_name, record.customer?.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{record.customer?.first_name} {record.customer?.last_name}</div>
                              <div className="text-sm text-muted-foreground">{record.customer?.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="whitespace-nowrap">
                              {format(new Date(record.check_in_time), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="whitespace-nowrap">
                            <Clock className="mr-1 h-3 w-3" />
                            {calculateDuration(record.check_in_time, record.check_out_time)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleCheckOut(record.id)}
                            disabled={isLoading}
                          >
                            <LogOut size={16} className="mr-0 sm:mr-2" />
                            <span className="hidden sm:inline">Check Out</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-card border rounded-lg p-8 text-center">
                <LogIn className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-1">No Active Check-Ins</h3>
                <p className="text-muted-foreground">
                  {searchText ? 'No customers match your search.' : 'All customers have been checked out or no one has checked in yet.'}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="pt-4">
             {isLoading && recentRecords.length === 0 ? (
              <div className="flex justify-center items-center h-60">
                 <div role="status" className="flex flex-col items-center">
                    <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="sr-only">Loading...</span>
                    <p className="mt-2 text-sm text-muted-foreground">Loading recent check-outs...</p>
                </div>
              </div>
            ) : recentRecords.length > 0 ? (
              <div className="bg-card border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] sm:w-[250px]">Customer</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead className="hidden md:table-cell">Check-out Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(record.customer?.first_name, record.customer?.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{record.customer?.first_name} {record.customer?.last_name}</div>
                              <div className="text-sm text-muted-foreground">{record.customer?.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="whitespace-nowrap">
                              {format(new Date(record.check_in_time), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="whitespace-nowrap">
                              {record.check_out_time && format(new Date(record.check_out_time), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            <Clock className="mr-1 h-3 w-3" />
                            {calculateDuration(record.check_in_time, record.check_out_time)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-card border rounded-lg p-8 text-center">
                <LogOut className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-1">No Recent Check-Outs</h3>
                <p className="text-muted-foreground">
                  No customers have been checked out recently.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <CustomerFaceScanDialog
        isOpen={isFaceScanDialogOpen}
        onOpenChange={setIsFaceScanDialogOpen}
        onFaceDetected={handleFaceDetectedForCheckInOut}
        storeId={currentUser?.store_id}
      />
    </PageLayout>
  );
};

export default CheckInOut;
