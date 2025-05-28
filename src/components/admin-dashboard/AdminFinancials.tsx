import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  BarChart3,
  CircleDollarSign,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TableHeader } from "../ui/table";

type ExpenseRow = {
  date: string;
  amount: number;
};

type ChartData = {
  month: string;
  expenses: number;
};

type SubscriptionRow = {
  month: string;
  subscribers: number;
  revenue: number;
};

type MatchTransactionRow = {
  id: string;
  customer: { first_name: string; last_name: string } | null;
  machine: { name: string } | null;
  store: { name: string } | null;
  initial_amount: number;
  match_percentage: number;
  matched_amount: number;
  total_credits: number;
  redemption_threshold: number;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const AdminFinancials = () => {
  const [timeRange, setTimeRange] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [expenseData, setExpenseData] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionRow[]>(
    []
  );
  const [matchTransactions, setMatchTransactions] = useState<
    MatchTransactionRow[]
  >([]);
  // Mock revenue data
  const revenueData = [
    { month: "Jan", expenses: 34000 },
    { month: "Feb", expenses: 31000 },
    { month: "Mar", expenses: 38000 },
    { month: "Apr", revenue: 81000, expenses: 35000, profit: 46000 },
    { month: "May", revenue: 76000, expenses: 33000, profit: 43000 },
    { month: "Jun", revenue: 92000, expenses: 37000, profit: 55000 },
    { month: "Jul", revenue: 105000, expenses: 40000, profit: 65000 },
    { month: "Aug", revenue: 99000, expenses: 39000, profit: 60000 },
    { month: "Sep", revenue: 87000, expenses: 38000, profit: 49000 },
    { month: "Oct", revenue: 94000, expenses: 42000, profit: 52000 },
    { month: "Nov", revenue: 110000, expenses: 45000, profit: 65000 },
    { month: "Dec", revenue: 125000, expenses: 50000, profit: 75000 },
  ];

  // Mock store revenue data
  const storeRevenueData = [
    { name: "Chicago Arcade", revenue: 125000, share: 20.5 },
    { name: "Seattle VR Zone", revenue: 110000, share: 18.0 },
    { name: "Austin Gaming Center", revenue: 98000, share: 16.1 },
    { name: "Miami Game Room", revenue: 87000, share: 14.3 },
    { name: "Denver Arcades", revenue: 79000, share: 13.0 },
    { name: "LA Gaming Hub", revenue: 72000, share: 11.8 },
    { name: "NYC VR Experience", revenue: 38000, share: 6.3 },
  ];

  useEffect(() => {
    const fetchExpenseData = async () => {
      const { data, error } = await supabase
        .from("finances")
        .select("date, amount");

      if (error || !data) {
        console.error("Error fetching finances:", error);
        return;
      }

      // Initialize all months with zero
      const monthlyTotals = new Map<string, number>();
      MONTHS.forEach((month) => monthlyTotals.set(month, 0));

      // Accumulate expenses by month
      data.forEach((row: ExpenseRow) => {
        const month = new Date(row.date).toLocaleString("en-US", {
          month: "short",
        });
        if (monthlyTotals.has(month)) {
          monthlyTotals.set(
            month,
            monthlyTotals.get(month)! + parseFloat(row.amount.toString())
          );
        }
      });

      // Format for chart
      const formatted: ChartData[] = MONTHS.map((month) => ({
        month,
        expenses: monthlyTotals.get(month) || 0,
      }));

      setExpenseData(formatted);
    };

    fetchExpenseData();
  }, []);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("start_date");

      if (error || !data) {
        console.error("Error fetching subscriptions:", error);
        return;
      }

      // Group by month
      const monthlyCounts = new Map<string, number>();
      MONTHS.forEach((month) => monthlyCounts.set(month, 0));

      data.forEach((row) => {
        const month = new Date(row.start_date).toLocaleString("en-US", {
          month: "short",
        });
        if (monthlyCounts.has(month)) {
          monthlyCounts.set(month, monthlyCounts.get(month)! + 1);
        }
      });

      // For demo, assume each subscription is $100
      const formatted: SubscriptionRow[] = MONTHS.map((month) => ({
        month,
        subscribers: monthlyCounts.get(month) || 0,
        revenue: (monthlyCounts.get(month) || 0) * 100,
      }));

      setSubscriptionData(formatted);
    };

    fetchSubscriptionData();
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching stores:", error);
        return;
      }
      setStores(data || []);
    };

    fetchStores();
  }, []);

  useEffect(() => {
    const fetchMatchTransactions = async () => {
      let query = supabase
        .from("match_transactions")
        .select(
          `
          id,
          initial_amount,
          match_percentage,
          matched_amount,
          total_credits,
          redemption_threshold,
          created_at,
          customer:customer_id (
            first_name,
            last_name
          ),
          machine:machine_id (
            name
          ),
          store:store_id (
            name,
            id
          )
        `
        )
        .limit(100);

      // Store filter by ID
      if (storeFilter !== "all") {
        query = query.eq("store_id", storeFilter);
      }

      // Time range filter
      if (timeRange !== "all") {
        const now = new Date();
        let fromDate: Date | null = null;

        if (timeRange === "week") {
          fromDate = new Date(now);
          fromDate.setDate(now.getDate() - 7);
        } else if (timeRange === "month") {
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (timeRange === "quarter") {
          const quarter = Math.floor(now.getMonth() / 3);
          fromDate = new Date(now.getFullYear(), quarter * 3, 1);
        } else if (timeRange === "year") {
          fromDate = new Date(now.getFullYear(), 0, 1);
        }

        if (fromDate) {
          query = query.gte("created_at", fromDate.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching match transactions:", error);
        return;
      }

      setMatchTransactions(data || []);
    };

    fetchMatchTransactions();
  }, [timeRange, storeFilter]);

  console.log(expenseData);

  const handleExportData = () => {
    toast.success("Exporting financial data...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Financial Analytics</h2>
        <Button
          variant="outline"
          className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700"
          onClick={handleExportData}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        {/* <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$1,073,000</div>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-green-500 mr-3">
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-medium">12.5%</span>
              </div>
              <span className="text-xs text-slate-400">vs previous year</span>
            </div>
          </CardContent>
        </Card> */}

        {/* Net Profit Card */}
        {/* <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">
              Net Profit
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$611,000</div>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-green-500 mr-3">
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-medium">8.3%</span>
              </div>
              <span className="text-xs text-slate-400">vs previous year</span>
            </div>
          </CardContent>
        </Card> */}

        {/* Average Store Revenue Card */}
        {/* <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">
              Avg. Store Revenue
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$87,500</div>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-amber-500 mr-3">
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-medium">5.2%</span>
              </div>
              <span className="text-xs text-slate-400">per store monthly</span>
            </div>
          </CardContent>
        </Card> */}

        {/* Subscription Revenue Card */}
        {/* <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">
              Subscription Revenue
            </CardTitle>
            <CreditCard className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$267,000</div>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-green-500 mr-3">
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-medium">17.8%</span>
              </div>
              <span className="text-xs text-slate-400">recurring annual</span>
            </div>
          </CardContent>
        </Card> */}
      </div>

      <Tabs defaultValue="expense" className="space-y-6">
        <TableHeader></TableHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger
              value="expense"
              className="data-[state=active]:bg-slate-700"
            >
              <CircleDollarSign className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="data-[state=active]:bg-slate-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger
              value="match-data"
              className="data-[state=active]:bg-slate-700"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Match Transaction
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="expense" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">Expense Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#222",
                        borderColor: "#666",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">
                Subscription Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-sm text-slate-400">
                      Month
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Subscribers
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Monthly Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionData.map((row) => (
                    <tr key={row.month} className="border-b border-slate-700">
                      <td className="py-3 text-slate-300">{row.month}</td>
                      <td className="py-3 text-slate-300">{row.subscribers}</td>
                      <td className="py-3 text-slate-300">
                        ${row.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match-data" className="space-y-6">
          <TableHeader>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-slate-300">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Time Range</span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-slate-300">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Store Filter</span>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TableHeader>
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">
                Match Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-sm text-slate-400">
                      Customer
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Machine
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Store
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Initial Amount
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Match %
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Matched Amount
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Total Credits
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Total Credits
                    </th>
                    <th className="text-left py-3 text-sm text-slate-400">
                      Redemption Threshold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matchTransactions.map((row) => (
                    <tr key={row.id} className="border-b border-slate-700">
                      <td className="py-3 text-slate-300">
                        {row.customer
                          ? `${row.customer.first_name} ${row.customer.last_name}`
                          : "N/A"}
                      </td>
                      <td className="py-3 text-slate-300">
                        {row.machine ? row.machine.name : "N/A"}
                      </td>
                      <td className="py-3 text-slate-300">
                        {row.store ? row.store.name : "N/A"}
                      </td>
                      <td className="py-3 text-slate-300">
                        ${Number(row.initial_amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-300">
                        {row.match_percentage}%
                      </td>
                      <td className="py-3 text-slate-300">
                        ${Number(row.matched_amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-300">
                        {row.total_credits}
                      </td>
                      <td className="py-3 text-slate-300">
                        {row.total_credits}
                      </td>
                      <td className="py-3 text-slate-300">
                        {row.redemption_threshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancials;
