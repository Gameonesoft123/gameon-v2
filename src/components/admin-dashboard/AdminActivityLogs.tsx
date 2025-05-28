
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Trash2, AlertCircle, CalendarIcon, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const AdminActivityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [date, setDate] = useState<Date | undefined>(undefined);
  
  // Mock data for activity logs
  const activityLogs = [
    {
      id: 'ACT-8761',
      user: 'admin@example.com',
      role: 'super_admin',
      action: 'login',
      target: 'System',
      details: 'Super admin login',
      timestamp: '2025-04-15 09:23:45',
      ip: '192.168.1.101'
    },
    {
      id: 'ACT-8760',
      user: 'store1@example.com',
      role: 'store_owner',
      action: 'update',
      target: 'Customer',
      details: 'Updated customer profile #12345',
      timestamp: '2025-04-15 09:12:30',
      ip: '192.168.1.102'
    },
    {
      id: 'ACT-8759',
      user: 'admin@example.com',
      role: 'super_admin',
      action: 'create',
      target: 'Store',
      details: 'Created new store: LA Arcade',
      timestamp: '2025-04-15 08:56:22',
      ip: '192.168.1.101'
    },
    {
      id: 'ACT-8758',
      user: 'support@example.com',
      role: 'support',
      action: 'impersonate',
      target: 'Store',
      details: 'Impersonated store: Chicago Arcade',
      timestamp: '2025-04-14 17:33:10',
      ip: '192.168.1.103'
    },
    {
      id: 'ACT-8757',
      user: 'store2@example.com',
      role: 'store_owner',
      action: 'delete',
      target: 'Machine',
      details: 'Removed machine: Pac-Man #5',
      timestamp: '2025-04-14 16:45:09',
      ip: '192.168.1.104'
    }
  ];

  // Filter logs based on search term and filters
  const filteredLogs = activityLogs.filter(log => {
    const searchMatch = 
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userMatch = userFilter === 'all' || log.role === userFilter;
    const actionMatch = actionFilter === 'all' || log.action === actionFilter;
    const dateMatch = !date || log.timestamp.includes(format(date, 'yyyy-MM-dd'));
    
    return searchMatch && userMatch && actionMatch && dateMatch;
  });

  const handleExportLogs = () => {
    // In a real application, this would export the logs to a CSV or Excel file
    toast.success('Exporting activity logs...');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setUserFilter('all');
    setActionFilter('all');
    setDate(undefined);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return <Badge className="bg-blue-500">Login</Badge>;
      case 'update':
        return <Badge className="bg-amber-500">Update</Badge>;
      case 'create':
        return <Badge className="bg-green-500">Create</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      case 'impersonate':
        return <Badge className="bg-violet-500">Impersonate</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-violet-600">Super Admin</Badge>;
      case 'store_owner':
        return <Badge className="bg-green-600">Store Owner</Badge>;
      case 'support':
        return <Badge className="bg-blue-600">Support</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Activity Logs</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>
      
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-200">System Activity</CardTitle>
          <CardDescription className="text-slate-400">
            Audit logs of all system actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search logs by ID, user or details..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-300 pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-slate-300">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>User</span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="store_owner">Store Owner</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-slate-300">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Action</span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="impersonate">Impersonate</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-slate-900 border-slate-700 text-slate-300"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {(searchTerm || userFilter !== 'all' || actionFilter !== 'all' || date) && (
                <Button 
                  variant="outline" 
                  className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700"
                  onClick={handleClearFilters}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3 text-slate-400">
                <AlertCircle className="h-6 w-6" />
                <span>No logs found matching your filters</span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-700">
                    <TableHead className="text-slate-400">ID</TableHead>
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400">Target</TableHead>
                    <TableHead className="text-slate-400">Timestamp</TableHead>
                    <TableHead className="text-slate-400">IP</TableHead>
                    <TableHead className="text-slate-400">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell className="font-medium text-slate-300">{log.id}</TableCell>
                      <TableCell className="text-slate-300">{log.user}</TableCell>
                      <TableCell>{getRoleBadge(log.role)}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-slate-300">{log.target}</TableCell>
                      <TableCell className="text-slate-400">{log.timestamp}</TableCell>
                      <TableCell className="text-slate-400">{log.ip}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogs;
