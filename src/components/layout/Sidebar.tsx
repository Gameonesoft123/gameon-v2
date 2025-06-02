import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart4,
  Users,
  Gamepad2,
  DollarSign,
  IdCard,
  UserCog,
  Megaphone,
  Gift,
  Shield,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Settings as SettingsIcon,
  Bell,
  Crown,
  LogOut,
  LogIn,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AllowedRole = "owner" | "manager" | "employee" | "admin" | "super_admin";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  count?: number;
  adminOnly?: boolean;
  allowedRoles?: Array<AllowedRole>;
};

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: BarChart4 },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Machines", href: "/machines", icon: Gamepad2 },
  { name: "Check In/Out", href: "/check-in-out", icon: LogIn },
  { name: "Finances", href: "/finances", icon: DollarSign },
  { name: "Backup ID", href: "/backup-id", icon: IdCard },
  {
    name: "Staff",
    href: "/staff",
    icon: UserCog,
    allowedRoles: ["owner", "manager"],
  },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Match", href: "/match", icon: Gift },
  {
    name: "Security",
    href: "/security",
    icon: Shield,
    allowedRoles: ["owner", "manager"],
  },
  { name: "Admin", href: "/admin", icon: Crown, adminOnly: true },
];

const superAdminNavItem: NavItem = {
  name: "Super Admin",
  href: "/admin-dashboard",
  icon: Globe,
  allowedRoles: ["super_admin"],
};

const profileNavItems: NavItem[] = [
  { name: "Profile", href: "/profile", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
  { name: "Notifications", href: "/notifications", icon: Bell, count: 2 },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const {
    user,
    isAdmin,
    isSuperAdmin,
    userRole,
    signOut,
    impersonatingStore,
    endImpersonation,
  } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      if (!impersonatingStore) {
        toast.success("You've been signed out successfully");
      }
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  const getInitials = () => {
    if (!user) return "GU";
    if (user.user_metadata && user.user_metadata.name) {
      const nameParts = user.user_metadata.name.split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    if (user.user_metadata && user.user_metadata.first_name) {
      const firstName = user.user_metadata.first_name;
      const lastName = user.user_metadata.last_name || "";
      return (firstName[0] + (lastName[0] || "")).toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "Guest User";
    if (impersonatingStore) {
      return `${user.user_metadata?.name} (Impersonating)`;
    }
    if (user.user_metadata && user.user_metadata.name) {
      return user.user_metadata.name;
    }
    if (user.user_metadata && user.user_metadata.first_name) {
      return `${user.user_metadata.first_name} ${
        user.user_metadata.last_name || ""
      }`;
    }
    return user.email || "User";
  };

  const getUserRole = () => {
    if (isAdmin) return "Admin";
    if (isSuperAdmin) return "Super Admin";
    if (userRole) return userRole.charAt(0).toUpperCase() + userRole.slice(1);
    return user ? "Store Manager" : "Guest";
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;

    if (item.allowedRoles && userRole) {
      const role = userRole as AllowedRole;
      return item.allowedRoles.includes(role) || isAdmin || isSuperAdmin;
    }

    return true;
  });

  return (
    <aside
      className={cn(
        "h-screen relative bg-game-secondary border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <h1 className="text-xl font-bold text-game-foreground">
            Game<span className="text-game-accent">On</span>
          </h1>
        )}
        {collapsed && <span className="text-xl font-bold mx-auto">GO</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-muted hover:bg-opacity-80 transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="p-2 flex flex-col h-[calc(100%-9rem)]">
        {impersonatingStore && (
          <div
            className={cn(
              "mb-2 py-2 px-3 bg-amber-100 text-amber-800 rounded-md",
              collapsed ? "text-xs text-center" : ""
            )}
          >
            {!collapsed ? (
              <>
                <p className="font-medium">Store Impersonation</p>
                <div className="flex mt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={endImpersonation}
                  >
                    End Impersonation
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs px-1"
                onClick={endImpersonation}
              >
                Exit
              </Button>
            )}
          </div>
        )}

        {isSuperAdmin && (
          <Link
            to={superAdminNavItem.href}
            className={cn(
              "flex items-center space-x-2 py-2.5 px-3 rounded-md text-sm mb-2",
              "hover:bg-game-primary hover:bg-opacity-10 transition-all duration-200",
              "text-muted-foreground hover:text-game-foreground",
              superAdminNavItem.href === location.pathname
                ? "bg-game-primary bg-opacity-10 text-game-foreground"
                : "",
              "bg-violet-50 border border-violet-200"
            )}
          >
            <superAdminNavItem.icon size={20} />
            {!collapsed && <span>{superAdminNavItem.name}</span>}
          </Link>
        )}

        <div className="space-y-1 flex-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 py-2.5 px-3 rounded-md text-sm",
                "hover:bg-game-primary hover:bg-opacity-10 transition-all duration-200",
                "text-muted-foreground hover:text-game-foreground",
                item.href === location.pathname
                  ? "bg-game-primary bg-opacity-10 text-game-foreground"
                  : "",
                item.adminOnly ? "bg-amber-50 border border-amber-200" : ""
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.name}</span>}
              {!collapsed && item.count && (
                <span className="ml-auto bg-game-primary rounded-full px-2 py-0.5 text-xs text-white">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-4 space-y-1">
          <Link
            to="/subscription"
            className={cn(
              "flex items-center space-x-2 py-2.5 px-3 rounded-md text-sm",
              "hover:bg-game-primary hover:bg-opacity-10 transition-all duration-200",
              "text-muted-foreground hover:text-game-foreground",
              location.pathname === "/subscription"
                ? "bg-game-primary bg-opacity-10 text-game-foreground"
                : ""
            )}
          >
            <DollarSign size={20} />
            {!collapsed && <span>Subscription</span>}
          </Link>

          {profileNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 py-2.5 px-3 rounded-md text-sm",
                "hover:bg-game-primary hover:bg-opacity-10 transition-all duration-200",
                "text-muted-foreground hover:text-game-foreground",
                item.href === location.pathname
                  ? "bg-game-primary bg-opacity-10 text-game-foreground"
                  : ""
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.name}</span>}
              {!collapsed && item.count && (
                <span className="ml-auto bg-game-primary rounded-full px-2 py-0.5 text-xs text-white">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-full border-t border-border p-4">
        {!user ? (
          <Link
            to="/auth"
            className={cn(
              "flex items-center space-x-3",
              collapsed ? "justify-center" : ""
            )}
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <span className="font-semibold">G</span>
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-medium">Sign In</p>
                <p className="text-xs text-muted-foreground">Click to login</p>
              </div>
            )}
          </Link>
        ) : !collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-game-primary text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">
                      {getUserDisplayName()}
                    </p>
                    {impersonatingStore && (
                      <Badge
                        variant="outline"
                        className="ml-2 px-1 py-0 h-5 text-[10px] border-amber-500 text-amber-700"
                      >
                        Impersonating
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user?.user_metadata?.user_role || "Guest"}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {impersonatingStore && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={endImpersonation}
                    className="cursor-pointer text-amber-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    End Impersonation
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {impersonatingStore ? "End Impersonation" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-game-primary text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {impersonatingStore && (
                  <DropdownMenuItem
                    onClick={endImpersonation}
                    className="cursor-pointer text-amber-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    End Impersonation
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {impersonatingStore ? "End Impersonation" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
