import React from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RevenueChart from "@/components/dashboard/RevenueChart";
import MachineStatus from "@/components/dashboard/MachineStatus";
import RecentCustomers from "@/components/dashboard/RecentCustomers";
import { Button } from "@/components/ui/button";
import {
  UserRound,
  DollarSign,
  Gamepad2,
  PlusCircle,
  FileText,
  Gift,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import CustomerDialog from "@/components/customers/CustomerDialog";
import ExpenseDialog from "@/components/finances/ExpenseDialog";
import CashRecordDialog from "@/components/machines/CashRecordDialog";
import BackupIDDialog from "@/components/backupid/BackupIDDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

const Index = () => {
  const { userRole } = useAuth();

  if (userRole === "super_admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return (
    <PageLayout title="Dashboard">
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <RevenueChart />
        <MachineStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <RecentCustomers />
        <div className="col-span-1 space-y-4">
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <CustomerDialog
              trigger={
                <Button
                  size="lg"
                  variant="default"
                  className="bg-game-primary hover:bg-game-primary/90 flex justify-start gap-3 h-14"
                >
                  <UserRound size={20} />
                  <div className="text-left">
                    <span className="block font-semibold">New Customer</span>
                    <span className="text-xs opacity-90">
                      Register customer with face ID
                    </span>
                  </div>
                </Button>
              }
            />

            <CashRecordDialog
              trigger={
                <Button
                  size="lg"
                  variant="default"
                  className="flex justify-start gap-3 h-14 bg-green-600 hover:bg-green-700"
                >
                  <DollarSign size={20} />
                  <div className="text-left">
                    <span className="block font-semibold">Record Cash</span>
                    <span className="text-xs opacity-90">
                      Log cash in/out for machines
                    </span>
                  </div>
                </Button>
              }
            />

            <ExpenseDialog
              trigger={
                <Button
                  size="lg"
                  variant="outline"
                  className="flex justify-start gap-3 h-14 hover:bg-muted/30"
                >
                  <DollarSign size={20} />
                  <div className="text-left">
                    <span className="block font-semibold">Log Expense</span>
                    <span className="text-xs opacity-70">
                      Record a business expense
                    </span>
                  </div>
                </Button>
              }
            />

            <BackupIDDialog
              trigger={
                <Button
                  size="lg"
                  variant="outline"
                  className="flex justify-start gap-3 h-14 hover:bg-muted/30"
                >
                  <PlusCircle size={20} />
                  <div className="text-left">
                    <span className="block font-semibold">Issue Backup ID</span>
                    <span className="text-xs opacity-70">
                      Register RFID card for customer
                    </span>
                  </div>
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Financial Reports
            </CardTitle>
            <CardDescription>View detailed financial reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/reports">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <FileText size={18} />
                <span>View Financial Reports</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Machine Overview
            </CardTitle>
            <CardDescription>Manage machines and cash records</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/machines">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Gamepad2 size={18} />
                <span>View Machine Details</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Customer Bonuses
            </CardTitle>
            <CardDescription>
              Assign and manage customer bonuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/match">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Gift size={18} />
                <span>Manage Bonuses</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Index;
