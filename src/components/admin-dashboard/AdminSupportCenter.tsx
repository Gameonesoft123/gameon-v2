
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search, Users, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminSupportCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for support tickets
  const tickets = [
    {
      id: 'TKT-7823',
      store: 'Chicago Arcade',
      subject: 'Payment processing issue',
      status: 'open',
      priority: 'high',
      created: '2 hours ago'
    },
    {
      id: 'TKT-7822',
      store: 'Seattle VR Zone',
      subject: 'Customer account merge request',
      status: 'in_progress',
      priority: 'medium',
      created: '5 hours ago'
    },
    {
      id: 'TKT-7821',
      store: 'Austin Gaming Center',
      subject: 'Machine reporting errors',
      status: 'in_progress',
      priority: 'high',
      created: '1 day ago'
    },
    {
      id: 'TKT-7820',
      store: 'Miami Gameroom',
      subject: 'Subscription upgrade question',
      status: 'open',
      priority: 'low',
      created: '1 day ago'
    },
    {
      id: 'TKT-7819',
      store: 'Denver Arcades',
      subject: 'Staff login not working',
      status: 'resolved',
      priority: 'medium',
      created: '2 days ago'
    }
  ];

  // Filter tickets based on search query
  const filteredTickets = searchQuery 
    ? tickets.filter(ticket => 
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ticket.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tickets;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-400">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const supportArticles = [
    { title: "Getting Started with Store Management", category: "tutorials", views: 1240 },
    { title: "Troubleshooting Machine Connections", category: "troubleshooting", views: 983 },
    { title: "Customer Check-In System Guide", category: "tutorials", views: 842 },
    { title: "Setting Up Payment Processing", category: "setup", views: 756 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Support Center</h2>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          New Support Case
        </Button>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-slate-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-slate-700">
            <Info className="h-4 w-4 mr-2" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="storeSupport" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Store Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-200">Support Tickets</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage platform support requests
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500">{tickets.filter(t => t.status === 'open').length} Open</Badge>
                  <Badge className="bg-amber-500">{tickets.filter(t => t.status === 'in_progress').length} In Progress</Badge>
                  <Badge variant="outline" className="border-green-500 text-green-400">{tickets.filter(t => t.status === 'resolved').length} Resolved</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search tickets by ID, store, or subject..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-300 pl-10"
                />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-700">
                    <TableHead className="text-slate-400">Ticket ID</TableHead>
                    <TableHead className="text-slate-400">Store</TableHead>
                    <TableHead className="text-slate-400">Subject</TableHead>
                    <TableHead className="text-slate-400">Priority</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map(ticket => (
                    <TableRow key={ticket.id} className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell className="font-medium text-slate-300">{ticket.id}</TableCell>
                      <TableCell className="text-slate-300">{ticket.store}</TableCell>
                      <TableCell className="text-slate-300">{ticket.subject}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-slate-400">{ticket.created}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">Knowledge Base</CardTitle>
              <CardDescription className="text-slate-400">
                Support articles and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search knowledge base..." 
                  className="bg-slate-900 border-slate-700 text-slate-300 pl-10"
                />
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-violet-400 mb-3">Popular Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supportArticles.map((article, i) => (
                      <Card key={i} className="bg-slate-900 border-slate-700 hover:border-violet-700 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-300">{article.title}</h4>
                              <div className="flex items-center mt-2">
                                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                                  {article.category}
                                </Badge>
                                <span className="text-xs text-slate-500 ml-3">{article.views} views</span>
                              </div>
                            </div>
                            <Info className="h-4 w-4 text-slate-500" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-violet-400 mb-3">Article Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Tutorials', 'Troubleshooting', 'Setup', 'Best Practices'].map((category, i) => (
                      <Card key={i} className="bg-slate-900 border-slate-700 hover:border-violet-700 transition-colors cursor-pointer">
                        <CardContent className="p-4 text-center">
                          <h4 className="text-slate-300">{category}</h4>
                          <p className="text-xs text-slate-500 mt-2">Browse articles</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storeSupport" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-200">Store Support</CardTitle>
                  <CardDescription className="text-slate-400">
                    Access store accounts to provide support
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3 p-4 bg-amber-900/20 border border-amber-700/30 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-400 font-medium">Support Access Notice</p>
                    <p className="text-xs text-amber-500/80 mt-1">
                      When you impersonate a store, all actions will be logged. Be sure to end your session when support is complete.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search stores by name or ID..." 
                  className="bg-slate-900 border-slate-700 text-slate-300 pl-10"
                />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-700">
                    <TableHead className="text-slate-400">Store Name</TableHead>
                    <TableHead className="text-slate-400">Owner</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Last Active</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['Chicago Arcade', 'Seattle VR Zone', 'Austin Gaming Center', 'Miami Gameroom', 'Denver Arcades'].map((store, i) => (
                    <TableRow key={i} className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell className="font-medium text-slate-300">{store}</TableCell>
                      <TableCell className="text-slate-300">{['John Smith', 'Sarah Johnson', 'Alex Williams', 'Carlos Rodriguez', 'Emma Davis'][i]}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-slate-300">Active</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">{['Just now', '3 hours ago', '1 day ago', '2 days ago', '1 week ago'][i]}</TableCell>
                      <TableCell>
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                          Impersonate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupportCenter;
