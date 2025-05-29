import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart4,
  Calendar,
  FileText,
  Filter,
  PieChart,
  TrendingUp,
  DollarSign,
  Gamepad2,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdvancedReports from "@/components/reports/AdvancedReports";
import { supabase } from "@/integrations/supabase/client";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { useAuth } from "@/contexts/auth";

type ProfitLossItem = {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
};

type MachineRevenueItem = {
  machine: string;
  machine_id: string;
  cashIn: number;
  cashOut: number;
  revenue: number;
};

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("profit-loss");
  const [profitLossData, setProfitLossData] = useState<ProfitLossItem[]>([]);
  const [machineRevenueData, setMachineRevenueData] = useState<
    MachineRevenueItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { currentStoreId } = useAuth();

  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      try {
        const now = new Date();

        // Time periods for profit/loss report
        const periods = [
          // {
          //   name: "Today",
          //   start: startOfDay(now).toISOString(),
          //   end: endOfDay(now).toISOString(),
          //   expenseStart: format(startOfDay(now), "yyyy-MM-dd"),
          //   expenseEnd: format(endOfDay(now), "yyyy-MM-dd"),
          // },
          // {
          //   name: "Yesterday",
          //   start: startOfDay(subDays(now, 1)).toISOString(),
          //   end: endOfDay(subDays(now, 1)).toISOString(),
          //   expenseStart: format(startOfDay(subDays(now, 1)), "yyyy-MM-dd"),
          //   expenseEnd: format(endOfDay(subDays(now, 1)), "yyyy-MM-dd"),
          // },
          // {
          //   name: "This Week",
          //   start: startOfDay(subDays(now, 6)).toISOString(),
          //   end: endOfDay(now).toISOString(),
          //   expenseStart: format(startOfDay(subDays(now, 6)), "yyyy-MM-dd"),
          //   expenseEnd: format(endOfDay(now), "yyyy-MM-dd"),
          // },
          {
            name: "This Month",
            start: startOfMonth(now).toISOString(),
            end: endOfMonth(now).toISOString(),
            expenseStart: format(startOfMonth(now), "yyyy-MM-dd"),
            expenseEnd: format(endOfMonth(now), "yyyy-MM-dd"),
          },
          {
            name: "Last Month",
            start: startOfMonth(subMonths(now, 1)).toISOString(),
            end: endOfMonth(subMonths(now, 1)).toISOString(),
            expenseStart: format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd"),
            expenseEnd: format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd"),
          },
          {
            name: "Last 6 Month",
            start: startOfMonth(subMonths(now, 6)).toISOString(),
            end: endOfMonth(subMonths(now, 6)).toISOString(),
            expenseStart: format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd"),
            expenseEnd: format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd"),
          },
        ];

        // Fetch profit/loss data for each period
        const profitLoss = await Promise.all(
          periods.map(async (period) => {
            // Fetch revenue data
            const { data: revenueData, error: revenueError } = await supabase
              .from("machine_history")
              .select("cash_in, cash_out, revenue")
              .gte("recorded_at", period.start)
              .lte("recorded_at", period.end)
              .eq("store_id", currentStoreId);

            console.log("revenueData", revenueData);
            console.log("storeId", currentStoreId);

            if (revenueError) throw revenueError;

            // Fetch expense data
            const { data: expenseData, error: expenseError } = await supabase
              .from("finances")
              .select("amount")
              .gte("date", period.expenseStart)
              .lte("date", period.expenseEnd)
              .eq("store_id", currentStoreId);

            if (expenseError) throw expenseError;

            console.log("expenseData", expenseData);
            // Calculate totals
            const totalRevenue = revenueData
              ? revenueData.reduce(
                  (sum, entry) =>
                    sum + Number(entry.cash_in) - Number(entry.cash_out),
                  0
                )
              : 0;
            const totalExpenses = expenseData
              ? expenseData.reduce(
                  (sum, entry) => sum + Number(entry.amount),
                  0
                )
              : 0;

            return {
              period: period.name,
              revenue: totalRevenue,
              expenses: totalExpenses,
              profit: totalRevenue - totalExpenses,
            };
          })
        );

        setProfitLossData(profitLoss);

        // Fetch machine revenue data
        const { data: machines, error: machinesError } = await supabase
          .from("machines")
          .select("id, name");

        if (machinesError) throw machinesError;

        if (machines) {
          const machineRevData = await Promise.all(
            machines.map(async (machine) => {
              const { data: machineHistory, error: historyError } =
                await supabase
                  .from("machine_history")
                  .select("cash_in, cash_out, revenue")
                  .eq("machine_id", machine.id)
                  .gte(
                    "recorded_at",
                    startOfDay(subDays(now, 30)).toISOString()
                  )
                  .eq("store_id", currentStoreId);

              if (historyError) throw historyError;

              const cashIn = machineHistory
                ? machineHistory.reduce(
                    (sum, entry) => sum + Number(entry.cash_in),
                    0
                  )
                : 0;
              const cashOut = machineHistory
                ? machineHistory.reduce(
                    (sum, entry) => sum + Number(entry.cash_out),
                    0
                  )
                : 0;
              const revenue = cashIn - cashOut;

              return {
                machine: machine.name,
                machine_id: machine.id,
                cashIn,
                cashOut,
                revenue,
              };
            })
          );

          // Sort by revenue (highest first)
          machineRevData.sort((a, b) => b.revenue - a.revenue);

          // Take top 5 machines only
          setMachineRevenueData(machineRevData.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching financial reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  return (
    <PageLayout title="Reports">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">
              Generate and view detailed financial reports
            </p>
          </div>
          <Button className="bg-game-primary hover:bg-game-primary/90">
            <FileText size={18} className="mr-2" />
            Export Report
          </Button>
        </div>

        <Alert>
          <BarChart4 className="h-4 w-4" />
          <AlertTitle>Financial Reporting</AlertTitle>
          <AlertDescription>
            Generate comprehensive reports on revenue, expenses, profit/loss,
            machine performance, and customer activity. Filter by custom date
            ranges or use preset periods.
          </AlertDescription>
        </Alert>

        <Tabs
          defaultValue="profit-loss"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="machine-revenue">Machine Revenue</TabsTrigger>
            <TabsTrigger value="advanced-reports">Advanced Reports</TabsTrigger>
            <TabsTrigger value="more-reports">More Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="profit-loss">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <TrendingUp size={20} className="text-game-primary" />
                </div>
                <CardDescription>
                  Overview of revenue, expenses and profit
                </CardDescription>
                <div className="highlight-bar"></div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading financial data...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitLossData.map((item) => (
                        <TableRow key={item.period}>
                          <TableCell className="font-medium">
                            {item.period}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.expenses.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-game-success">
                            ${item.profit.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.revenue > 0
                              ? Math.round((item.profit / item.revenue) * 100)
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {profitLossData
                          .reduce((sum, item) => sum + item.revenue, 0)
                          .toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Expenses
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {profitLossData
                          .reduce((sum, item) => sum + item.expenses, 0)
                          .toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Net Profit
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        $
                        {profitLossData
                          .reduce((sum, item) => sum + item.profit, 0)
                          .toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="machine-revenue">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Machine Revenue Report</CardTitle>
                  <Gamepad2 size={20} className="text-game-primary" />
                </div>
                <CardDescription>
                  Detailed breakdown of revenue by machine
                </CardDescription>
                <div className="highlight-bar"></div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading machine data...
                  </div>
                ) : machineRevenueData.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No machine data available
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead className="text-right">Cash In</TableHead>
                        <TableHead className="text-right">Cash Out</TableHead>
                        <TableHead className="text-right">
                          Net Revenue
                        </TableHead>
                        <TableHead className="text-right">Hold %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {machineRevenueData.map((machine) => (
                        <TableRow key={machine.machine_id}>
                          <TableCell className="font-medium">
                            {machine.machine}
                          </TableCell>
                          <TableCell className="text-right">
                            ${machine.cashIn.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${machine.cashOut.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-game-success">
                            ${Math.abs(machine.revenue).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {machine.cashIn > 0
                              ? Math.round(
                                  (Math.abs(machine.revenue) / machine.cashIn) *
                                    100
                                )
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        $
                        {machineRevenueData
                          .reduce((sum, item) => sum + item.cashIn, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {machineRevenueData
                          .reduce((sum, item) => sum + item.cashOut, 0)
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-game-success">
                        $
                        {machineRevenueData
                          .reduce(
                            (sum, item) => sum + Math.abs(item.revenue),
                            0
                          )
                          .toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const totalCashIn = machineRevenueData.reduce(
                            (sum, item) => sum + item.cashIn,
                            0
                          );
                          const totalRevenue = machineRevenueData.reduce(
                            (sum, item) => sum + Math.abs(item.revenue),
                            0
                          );
                          return totalCashIn > 0
                            ? Math.round((totalRevenue / totalCashIn) * 100)
                            : 0;
                        })()}
                        %
                      </TableCell>
                    </TableRow>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced-reports">
            <AdvancedReports />
          </TabsContent>

          <TabsContent value="more-reports">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Additional Reports</CardTitle>
                  <PieChart size={20} className="text-game-primary" />
                </div>
                <CardDescription>
                  Comprehensive analysis and custom reporting
                </CardDescription>
                <div className="highlight-bar"></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Machine Utilization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Analyze which machines are being used the most and
                        during what hours
                      </p>
                      <Button variant="outline" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Customer Spending Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Track customer spending patterns and identify your top
                        spenders
                      </p>
                      <Button variant="outline" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Seasonal Trend Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Compare performance across different time periods and
                        identify trends
                      </p>
                      <Button variant="outline" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Marketing Campaign ROI
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Measure the effectiveness and return on investment for
                        marketing campaigns
                      </p>
                      <Button variant="outline" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <DollarSign className="text-primary h-10 w-10 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            Premium SaaS Plan - $300/month
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            This software is offered as a premium SaaS solution
                            with the following benefits:
                          </p>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center">
                              <span className="mr-2">✓</span>
                              Comprehensive financial tracking and reporting
                            </li>
                            <li className="flex items-center">
                              <span className="mr-2">✓</span>
                              Customer management with facial recognition
                            </li>
                            <li className="flex items-center">
                              <span className="mr-2">✓</span>
                              Machine monitoring and performance analytics
                            </li>
                            <li className="flex items-center">
                              <span className="mr-2">✓</span>
                              SMS marketing with Twilio integration
                            </li>
                            <li className="flex items-center">
                              <span className="mr-2">✓</span>
                              Complete security and backup ID system
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Reports;
