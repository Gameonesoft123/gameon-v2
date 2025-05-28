
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserCog, Search, X } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import StaffDialog from '@/components/staff/StaffDialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  username: string;
  created_at: string;
}

const Staff: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const filteredStaffMembers = staffMembers.filter(staff => {
    const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
           staff.email.toLowerCase().includes(query) || 
           staff.role.toLowerCase().includes(query);
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role.toLowerCase()) {
      case 'owner': return "bg-purple-500";
      case 'manager': return "bg-blue-500";
      case 'employee': return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <PageLayout title="Staff Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <p className="text-muted-foreground">Manage employees and their permissions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search staff..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <StaffDialog onStaffAdded={fetchStaffMembers} />
          </div>
        </div>
        
        <Alert>
          <UserCog className="h-4 w-4" />
          <AlertTitle>Staff Management</AlertTitle>
          <AlertDescription>
            This page allows you to manage your staff members, assign roles and permissions,
            track shifts, and monitor employee performance.
          </AlertDescription>
        </Alert>
        
        {staffMembers.length > 0 ? (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-[120px]">Role</TableHead>
                    <TableHead className="w-[120px]">Username</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffMembers.map((staff) => (
                    <TableRow key={staff.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(staff.first_name, staff.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {staff.first_name} {staff.last_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{staff.email}</div>
                          <div className="text-muted-foreground text-sm">{staff.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(staff.role)} capitalize`}>
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {staff.username}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <UserCog size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Staff Directory</h3>
            <p className="text-muted-foreground mb-4">
              Your staff management system is ready to use. Add your first staff member to get started.
            </p>
            <StaffDialog 
              isSampleStaff={true}
              trigger={
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                  <UserCog size={16} className="mr-2" />
                  Add Sample Staff
                </button>
              } 
              onStaffAdded={fetchStaffMembers}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Staff;
