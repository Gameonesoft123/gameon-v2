import React from 'react';
import { Bell, Search, Calendar, Settings, LogOut, User, UserCircle, ArrowLeftRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const Header: React.FC = () => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const { user, signOut, isAdmin, isSuperAdmin, impersonatingStore, endImpersonation } = useAuth();
  const location = useLocation();
  
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/admin-dashboard') return 'Super Admin Dashboard';
    
    return location.pathname.substring(1).split('-').map(
      word => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("You've been signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };
  
  const getInitials = () => {
    if (!user) return 'GU';
    if (user.user_metadata && user.user_metadata.name) {
      const nameParts = user.user_metadata.name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  return (
    <header className="py-4 px-6 border-b border-border flex items-center justify-between">
      <div>
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
          {impersonatingStore && (
            <Badge variant="outline" className="ml-3 px-2 py-0.5 bg-amber-100 text-xs border-amber-500 text-amber-800">
              Store Impersonation Mode
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm flex items-center">
          <Calendar size={14} className="mr-1" />
          {today}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative mr-2">
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 pr-9 rounded-md bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-game-primary w-60"
          />
          <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        
        {impersonatingStore && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={endImpersonation}
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            End Impersonation
          </Button>
        )}
        
        {isSuperAdmin && !location.pathname.includes('admin-dashboard') && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin-dashboard">
              <Globe className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>
        )}
        
        <Button variant="outline" size="icon" asChild>
          <Link to="/notifications">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 bg-game-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Link>
        </Button>
        
        <Button variant="outline" size="icon" asChild>
          <Link to="/settings">
            <Settings size={18} />
          </Link>
        </Button>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
                <Avatar>
                  <AvatarFallback className="bg-game-primary text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="w-full cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {isSuperAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin-dashboard" className="w-full cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    Super Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {impersonatingStore && (
                <DropdownMenuItem onClick={endImpersonation} className="cursor-pointer text-amber-600">
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  End Store Impersonation
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
