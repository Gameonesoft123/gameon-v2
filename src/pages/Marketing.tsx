
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Megaphone, Mail, CalendarDays, Tag, Users, BarChart3, MessageSquare, CheckCircle2, XCircle, Smartphone, SendHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  selected?: boolean;
}

const Marketing: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [template, setTemplate] = useState('');
  const [messageFilter, setMessageFilter] = useState('all');
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showAudienceDialog, setShowAudienceDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [campaignInProgress, setCampaignInProgress] = useState(false);

  const smsTemplates = [
    { id: 'special', content: 'Special promotion just for you! Visit our arcade today and get 50% off on all games!' },
    { id: 'event', content: 'Join us this weekend for our special gaming tournament! Great prizes to be won.' },
    { id: 'reminder', content: 'We miss you! It\'s been a while since your last visit. Come back and enjoy your favorite games!' },
    { id: 'birthday', content: 'Happy Birthday! We\'re giving you a special birthday bonus - 10 free game tokens!' }
  ];

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const { data, error } = await supabase
          .from('customers')
          .select('*');
        
        if (error) throw error;
        
        // Initialize customers with selected property
        const customersWithSelected = data.map((customer: Customer) => ({
          ...customer,
          selected: false
        }));
        
        setCustomers(customersWithSelected);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on selection
  useEffect(() => {
    const selected = customers.filter(customer => customer.selected);
    setSelectedCustomers(selected);
  }, [customers]);

  const handleTriggerCampaign = () => {
    setCampaignInProgress(true);
    toast.success('Campaign creation in progress');
    
    // Simulate campaign creation process
    setTimeout(() => {
      setCampaignInProgress(false);
      toast.success('Campaign has been scheduled');
      setShowCampaignDialog(false);
    }, 1500);
  };

  const handleTriggerZapier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast.error("Please enter your Zapier webhook URL");
      return;
    }

    setIsLoading(true);
    
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          campaign_type: "arcade_promotion"
        }),
      });

      toast.success("Marketing campaign initiated through Zapier");
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast.error("Failed to trigger the Zapier webhook");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => 
        customer.id === customerId ? { ...customer, selected: checked } : customer
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => ({ ...customer, selected: checked }))
    );
  };

  const handleTemplateChange = (templateId: string) => {
    setTemplate(templateId);
    const selectedTemplate = smsTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setSmsMessage(selectedTemplate.content);
    }
  };

  const handleSendSMS = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    if (!smsMessage.trim()) {
      toast.error("Please enter a message to send");
      return;
    }

    setIsSendingSMS(true);
    toast.info(`Sending SMS to ${selectedCustomers.length} customers...`);

    try {
      const phoneNumbers = selectedCustomers.map(customer => customer.phone);
      
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: phoneNumbers,
          message: smsMessage
        }
      });
      
      if (error) throw error;
      
      toast.success(`SMS sent successfully to ${selectedCustomers.length} customers!`);
      
      // Reset selections after successful send
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => ({ ...customer, selected: false }))
      );
      setSmsMessage('');
      setTemplate('');
      
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS messages");
    } finally {
      setIsSendingSMS(false);
    }
  };

  const filteredCustomers = messageFilter === 'all' 
    ? customers 
    : customers.filter(customer => {
        if (messageFilter === 'selected') return customer.selected;
        return false;
      });

  return (
    <PageLayout title="Marketing">
      <div className="space-y-6">
        <Alert>
          <Megaphone className="h-4 w-4" />
          <AlertTitle>Marketing Management</AlertTitle>
          <AlertDescription>
            Use this page to create and manage marketing campaigns, promotions, events and SMS broadcasts for your arcade.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="sms">
              <MessageSquare className="mr-2 h-4 w-4" />
              SMS Marketing
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Mail className="mr-2 h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="promotions">
              <Tag className="mr-2 h-4 w-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="events">
              <CalendarDays className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="integration">
              <SendHorizontal className="mr-2 h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sms">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-game-primary" />
                    SMS Broadcast
                  </CardTitle>
                  <CardDescription>
                    Send SMS messages to selected customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message Template</label>
                    <Select value={template} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or write your own" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Message</SelectItem>
                        {smsTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.id.charAt(0).toUpperCase() + template.id.slice(1)} Template
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea 
                      placeholder="Enter your message here..." 
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      {smsMessage.length} characters • {Math.ceil(smsMessage.length / 160)} SMS
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Recipients</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomers.length} customers selected
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={handleSendSMS} 
                      disabled={isSendingSMS || selectedCustomers.length === 0 || !smsMessage.trim()}
                      className="w-full"
                    >
                      {isSendingSMS ? "Sending..." : "Send SMS"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-game-primary" />
                    Customer Selection
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <CardDescription>
                      Select customers to receive your SMS
                    </CardDescription>
                    <Select value={messageFilter} onValueChange={setMessageFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        <SelectItem value="selected">Selected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingCustomers ? (
                    <div className="flex justify-center items-center p-4 h-40">
                      <p>Loading customers...</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox 
                                checked={customers.length > 0 && customers.every(c => c.selected)}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center">
                                No customers found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={customer.selected}
                                    onCheckedChange={(checked) => 
                                      handleSelectCustomer(customer.id, checked === true)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      {customer.first_name} {customer.last_name}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{customer.phone}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-game-primary" />
                    Email Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Create and manage email marketing campaigns for your customers.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setShowCampaignDialog(true)} variant="outline" className="w-full">
                    Create Campaign
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-game-primary" />
                    Audience Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Target specific customer segments with tailored campaigns.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setShowAudienceDialog(true)} variant="outline" className="w-full">
                    Define Audience
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-game-primary" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Track the performance of your marketing campaigns.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setShowAnalyticsDialog(true)} variant="outline" className="w-full">
                    View Analytics
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="promotions">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-game-primary" />
                    Special Offers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Manage special promotions, discounts and offers for your arcade.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setShowPromotionDialog(true)} variant="outline" className="w-full">
                    Create Promotion
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-game-primary" />
                    Arcade Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Organize and promote special events at your arcade.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setShowEventDialog(true)} variant="outline" className="w-full">
                    Schedule Event
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="integration">
            <Card>
              <CardHeader>
                <CardTitle>Zapier Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTriggerZapier} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="webhook" className="text-sm font-medium">Zapier Webhook URL</label>
                    <Input 
                      id="webhook"
                      type="text"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Trigger Zapier Webhook"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Configure your email marketing campaign settings below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="campaign-name" className="text-sm font-medium">Campaign Name</label>
              <Input id="campaign-name" placeholder="Summer Arcade Special" />
            </div>
            <div className="space-y-2">
              <label htmlFor="campaign-subject" className="text-sm font-medium">Email Subject</label>
              <Input id="campaign-subject" placeholder="Don't miss our summer arcade specials!" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Template</label>
              <Select defaultValue="promotional">
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="event">Event Invitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input type="date" />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
              <Button onClick={handleTriggerCampaign} disabled={campaignInProgress}>
                {campaignInProgress ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Audience Dialog */}
      <Dialog open={showAudienceDialog} onOpenChange={setShowAudienceDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Define Target Audience</DialogTitle>
            <DialogDescription>
              Set criteria to target specific customer segments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="audience-name" className="text-sm font-medium">Audience Name</label>
              <Input id="audience-name" placeholder="Regular Players" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Visit</label>
              <Select defaultValue="30days">
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="inactive">Inactive (90+ days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Spending Level</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select spending level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="high">High Spenders</SelectItem>
                  <SelectItem value="medium">Medium Spenders</SelectItem>
                  <SelectItem value="low">Low Spenders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAudienceDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success("Audience segment saved");
                setShowAudienceDialog(false);
              }}>
                Save Audience
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Marketing Analytics</DialogTitle>
            <DialogDescription>
              View performance metrics for your marketing campaigns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">SMS Campaign Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-xl font-semibold">248</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-xl font-semibold">242</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-xl font-semibold">18%</p>
                </div>
              </div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Email Campaign Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-xl font-semibold">520</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open Rate</p>
                  <p className="text-xl font-semibold">32%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Click Rate</p>
                  <p className="text-xl font-semibold">12%</p>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => setShowAnalyticsDialog(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Promotion Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Promotion</DialogTitle>
            <DialogDescription>
              Set up a special offer or discount for your arcade customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="promo-name" className="text-sm font-medium">Promotion Name</label>
              <Input id="promo-name" placeholder="Weekend Special" />
            </div>
            <div className="space-y-2">
              <label htmlFor="promo-desc" className="text-sm font-medium">Description</label>
              <Textarea id="promo-desc" placeholder="50% off all arcade games on Saturday" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
                <Input id="start-date" type="date" />
              </div>
              <div className="space-y-2">
                <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
                <Input id="end-date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="discount" className="text-sm font-medium">Discount Percentage</label>
              <Input id="discount" type="number" placeholder="50" />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPromotionDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success("Promotion created successfully");
                setShowPromotionDialog(false);
              }}>
                Create Promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
            <DialogDescription>
              Plan and organize a special event at your arcade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="event-name" className="text-sm font-medium">Event Name</label>
              <Input id="event-name" placeholder="Gaming Tournament" />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-desc" className="text-sm font-medium">Description</label>
              <Textarea id="event-desc" placeholder="Join our monthly gaming tournament with prizes for top players" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="event-date" className="text-sm font-medium">Event Date</label>
                <Input id="event-date" type="date" />
              </div>
              <div className="space-y-2">
                <label htmlFor="event-time" className="text-sm font-medium">Event Time</label>
                <Input id="event-time" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium">Maximum Capacity</label>
              <Input id="capacity" type="number" placeholder="50" />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success("Event scheduled successfully");
                setShowEventDialog(false);
              }}>
                Schedule Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </PageLayout>
  );
};

export default Marketing;
