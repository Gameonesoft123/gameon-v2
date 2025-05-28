import React, { useState, useEffect } from 'react';
import { Bell, X, ChevronLeft, ChevronRight, UserCheck, DollarSign, Gamepad2, AlertTriangle, Loader2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase, customTable } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'customer' | 'revenue' | 'machine' | 'security';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  store_id?: string | null;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'customer' | 'revenue' | 'machine' | 'security'>('all');
  const [loading, setLoading] = useState(true);
  const { user, currentUser, isSuperAdmin, currentStoreId } = useAuth();
  
  const itemsPerPage = 5;
  
  // Fetch notifications from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        
        // If not super admin and has a store_id, filter by store_id
        // RLS will handle the filtering server-side, but we also do it client-side as a backup
        if (!isSuperAdmin && currentStoreId) {
          query = query.eq('store_id', currentStoreId);
        }
          
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setNotifications(data as Notification[]);
        } else {
          setNotifications([]);
        }
      } catch (error: any) {
        console.error('Error fetching notifications:', error.message);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time listener for notifications updates
    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          ...((!isSuperAdmin && currentStoreId) ? { filter: `store_id=eq.${currentStoreId}` } : {})
        }, 
        (payload) => {
          console.log('Notification change received:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            
            // If not super admin, make sure this notification is for the current store
            if (!isSuperAdmin && currentStoreId && newNotification.store_id !== currentStoreId) {
              return;
            }
            
            setNotifications(prev => [newNotification, ...prev]);
            toast.info('New notification received');
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === payload.new.id 
                  ? payload.new as Notification 
                  : notification
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(notification => notification.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe(status => {
        console.log('Notification channel status:', status);
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to notifications channel');
        }
      });
      
    return () => {
      console.log('Removing notifications channel');
      supabase.removeChannel(channel);
    };
  }, [isSuperAdmin, currentStoreId]);
  
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });
  
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      toast.success('Notification marked as read');
    } catch (error: any) {
      console.error('Error marking notification as read:', error.message);
      toast.error('Failed to update notification');
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
        
      if (error) {
        throw error;
      }
      
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error.message);
      toast.error('Failed to update notifications');
    }
  };
  
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      toast.success('Notification deleted');
    } catch (error: any) {
      console.error('Error deleting notification:', error.message);
      toast.error('Failed to delete notification');
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'revenue':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'machine':
        return <Gamepad2 className="h-5 w-5 text-purple-500" />;
      case 'security':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <PageLayout title="Notifications">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Stay updated with important events and alerts
            {currentUser?.store_name && (
              <span className="font-medium ml-1">
                for {currentUser.store_name}
              </span>
            )}
          </p>
          
          <Button variant="outline" onClick={markAllAsRead} disabled={!notifications.some(n => !n.read) || loading}>
            Mark All as Read
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(value: 'all' | 'unread' | 'customer' | 'revenue' | 'machine' | 'security') => {
          setFilter(value);
          setCurrentPage(1);
        }} className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="all">
              All
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-game-primary text-xs text-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="customer">
              Customers
            </TabsTrigger>
            <TabsTrigger value="revenue">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="machine">
              Machines
            </TabsTrigger>
            <TabsTrigger value="security">
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={filter} className="pt-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-game-primary" />
              </div>
            ) : paginatedNotifications.length > 0 ? (
              <div className="space-y-2">
                {paginatedNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`
                      flex items-start gap-4 p-4 rounded-lg border 
                      ${notification.read ? 'bg-card' : 'bg-muted/30 border-muted-foreground/20'}
                    `}
                  >
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className={`font-medium ${!notification.read && 'text-game-primary'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      
                      {!notification.read && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 h-auto mt-1 text-game-primary"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? "You don't have any notifications yet."
                    : filter === 'unread'
                      ? "You don't have any unread notifications."
                      : `You don't have any ${filter} notifications.`
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Notifications;
