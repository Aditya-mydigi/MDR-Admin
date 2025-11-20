"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  ArrowUpDown,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";
import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const blueAccent = "bg-[#00BFFF] text-white hover:bg-[#0090cc]";
const blueOutline =
  "border-[#00BFFF] text-[#00BFFF] hover:bg-[#00BFFF] hover:text-white";

// -----------------------------
// Types
// -----------------------------
interface Subscription {
  username: string;
  email: string;
  plan_id: string | null;
  final_amount: number | string | null;
  datetime: string | null;
}

interface Transaction {
  plan_id: string | null;
  final_amount: any;
  datetime: string;
}

interface GroupedUser {
  name: string;
  email: string;
  transactions: Transaction[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

// -----------------------------
// Component
// -----------------------------
export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<
    "subscriptions" | "transactions"
  >("subscriptions");
  const [activeRegionTab, setActiveRegionTab] = useState<"india" | "usa">(
    "india"
  );
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<GroupedUser[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "datetime",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    plan_id: "",
    date: "",
  });

  // Load sidebar collapse state
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
    setLoading(false);
  }, []);

  // Save sidebar collapse state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Fetch data on tab switch
  useEffect(() => {
    const fetchData = async () => {
      setTabLoading(true);
      setError(null);

      try {
        const subEndpoint =
          activeRegionTab === "india"
            ? "/api/billing/subscription/india"
            : "/api/billing/subscription/usa";

        const txnEndpoint =
          activeRegionTab === "india"
            ? "/api/billing/transactions/india"
            : "/api/billing/transactions/usa";

        const [subRes, txnRes] = await Promise.all([
          fetch(subEndpoint),
          fetch(txnEndpoint),
        ]);

        const subJson = await subRes.json();
        const txnJson = await txnRes.json();

        if (subJson.success) {
          setSubscriptions(subJson.data);
        } else {
          setSubscriptions([]);
        }

        if (Array.isArray(txnJson)) {
          setTransactions(txnJson);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        setError("Network error occurred");
        setSubscriptions([]);
        setTransactions([]);
      } finally {
        setTabLoading(false);
      }
    };

    fetchData();
  }, [activeRegionTab]); // FIXED size array (always 1 item)
  // 🔥 No activeMainTab here

  // -----------------------------
  // Helpers
  // -----------------------------
  const resetFilters = () => {
    setFilters({
      plan_id: "",
      date: "",
    });
    setSearchTerm("");
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (
    amount: number | string | null,
    region: "India" | "USA"
  ) => {
    if (amount === null || amount === undefined) {
      return region === "India" ? "₹0.00" : "$0.00";
    }

    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) {
      return region === "India" ? "₹0.00" : "$0.00";
    }

    return region === "India"
      ? `₹${numericAmount.toFixed(2)}`
      : `$${numericAmount.toFixed(2)}`;
  };

  const toggleRow = (email: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getUserTransactions = (email: string) => {
    const user = transactions.find((u) => u.email === email);
    return user?.transactions || [];
  };
  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.plan_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.plan_id && filters.plan_id !== "all") {
      filtered = filtered.filter((sub) => sub.plan_id === filters.plan_id);
    }
    if (filters.date) {
      filtered = filtered.filter((sub) => {
        if (!sub.datetime) return false;

        const itemDate = new Date(sub.datetime).toDateString();
        const filterDate = new Date(filters.date).toDateString();

        return itemDate === filterDate; // exact match
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Subscription];
      const bValue = b[sortConfig.key as keyof Subscription];

      if (aValue === null || bValue === null) return 0;
      if (sortConfig.key === "final_amount") {
        const aNum = parseFloat(aValue as string);
        const bNum = parseFloat(bValue as string);
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      if (sortConfig.key === "datetime") {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        return sortConfig.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return filtered;
  }, [subscriptions, searchTerm, sortConfig, filters]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.transactions.some((txn) =>
            txn.plan_id?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply filters
    if (filters.plan_id && filters.plan_id !== "all") {
      filtered = filtered.filter((user) =>
        user.transactions.some((txn) => txn.plan_id === filters.plan_id)
      );
    }
    if (filters.date) {
      filtered = filtered.filter((user) =>
        user.transactions.some((txn) => {
          const itemDate = new Date(txn.datetime).toDateString();
          const filterDate = new Date(filters.date).toDateString();
          return itemDate === filterDate; // exact match
        })
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortConfig.key === "transactions") {
        const aCount = a.transactions.length;
        const bCount = b.transactions.length;
        return sortConfig.direction === "asc"
          ? aCount - bCount
          : bCount - aCount;
      }
      const aValue = a[sortConfig.key as keyof GroupedUser];
      const bValue = b[sortConfig.key as keyof GroupedUser];
      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return filtered;
  }, [transactions, searchTerm, sortConfig, filters]);

  // Get unique plan IDs for filter
  const uniquePlanIds = useMemo(() => {
    const plans = new Set<string>();
    subscriptions.forEach((sub) => sub.plan_id && plans.add(sub.plan_id));
    transactions.forEach((user) =>
      user.transactions.forEach((txn) => txn.plan_id && plans.add(txn.plan_id))
    );
    return Array.from(plans);
  }, [subscriptions, transactions]);

  // -----------------------------
  // Table Renderers
  // -----------------------------
  const renderSubscriptionTable = (
    data: Subscription[],
    region: "India" | "USA"
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{region} Subscriptions</CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Plan ID</label>
                  <Select
                    value={filters.plan_id}
                    onValueChange={(value) =>
                      setFilters({ ...filters, plan_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      {uniquePlanIds.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters({ ...filters, date: e.target.value })
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {tabLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-4">No subscriptions found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("username")}
                  />
                  Username
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("email")}
                    className="flex items-center gap-1"
                  >
                    Email
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("plan_id")}
                    className="flex items-center gap-1"
                  >
                    Plan ID
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("datetime")}
                    className="flex items-center gap-1"
                  >
                    Payment Date
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("final_amount")}
                    className="flex items-center gap-1"
                  >
                    Amount
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((row, idx) => (
                <React.Fragment key={idx}>
                  {/* Main user row */}
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(row.email!)}
                      >
                        {expandedRows.has(row.email!) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>

                    <TableCell>{row.username || "—"}</TableCell>
                    <TableCell>{row.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.plan_id || "—"}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(row.datetime)}</TableCell>
                    <TableCell>
                      {formatAmount(row.final_amount, region)}
                    </TableCell>
                  </TableRow>

                  {/* 🔻 EXPANDED TRANSACTIONS ROW — STEP 3 GOES HERE */}
                  {expandedRows.has(row.email!) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="pl-8">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Plan ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {getUserTransactions(row.email!).length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    className="text-center"
                                  >
                                    No transactions found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                getUserTransactions(row.email!).map(
                                  (txn, tIdx) => (
                                    <TableRow key={tIdx}>
                                      <TableCell>
                                        <Badge variant="outline">
                                          {txn.plan_id}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {formatAmount(txn.final_amount, region)}
                                      </TableCell>
                                      <TableCell>
                                        {formatDate(txn.datetime)}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderTransactionTable = (
    data: GroupedUser[],
    region: "India" | "USA"
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{region} Transactions</CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Plan ID</label>
                  <Select
                    value={filters.plan_id}
                    onValueChange={(value) =>
                      setFilters({ ...filters, plan_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      {uniquePlanIds.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters({ ...filters, date: e.target.value })
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {tabLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-4">No transactions found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1"
                  >
                    Name
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("email")}
                    className="flex items-center gap-1"
                  >
                    Email
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("transactions")}
                    className="flex items-center gap-1"
                  >
                    Transactions
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((user) => (
                <React.Fragment key={user.email}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(user.email)}
                      >
                        {expandedRows.has(user.email) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{user.name || "—"}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Transactions ({user.transactions.length})
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          {user.transactions.map((txn, idx) => (
                            <DropdownMenuItem
                              key={idx}
                              className="flex flex-col items-start p-3 rounded-lg bg-blue-50 mb-2 border border-blue-100 shadow-sm text-sm"
                            >
                              <div className="w-full flex justify-between font-medium">
                                <span>Plan ID:</span>
                                <span className="text-[#00BFFF]">
                                  {txn.plan_id || "—"}
                                </span>
                              </div>
                              <div className="w-full flex justify-between">
                                <span>Amount:</span>
                                <span>
                                  {formatAmount(txn.final_amount, region)}
                                </span>
                              </div>
                              <div className="w-full flex justify-between">
                                <span>Date:</span>
                                <span>{formatDate(txn.datetime)}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(user.email) && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="pl-8">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Plan ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {user.transactions.map((txn, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {txn.plan_id || "—"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {formatAmount(txn.final_amount, region)}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(txn.datetime)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div
      className={clsx(
        "min-h-screen bg-background flex",
        sidebarOpen && "overflow-hidden"
      )}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col transition-all duration-300">
        <Header
          title="Billing Details"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/40">
          <Tabs
            value={activeMainTab}
            onValueChange={(v) =>
              setActiveMainTab(v as "subscriptions" | "transactions")
            }
            className="space-y-6"
          >
            <TabsList className="grid w-1/2 mx-auto grid-cols-2 rounded-xl bg-blue-50 p-1 shadow-sm">
              <TabsTrigger
                value="subscriptions"
                className="text-sm py-1 px-3 data-[state=active]:bg-[#00BFFF] data-[state=active]:text-white rounded-lg transition-all"
              >
                Subscriptions
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="text-sm py-1 px-3 data-[state=active]:bg-[#00BFFF] data-[state=active]:text-white rounded-lg transition-all"
              >
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions">
              <Tabs
                value={activeRegionTab}
                onValueChange={(v) => setActiveRegionTab(v as "india" | "usa")}
              >
                <TabsList className="rounded-2xl bg-muted p-1 flex w-fit mx-auto shadow-sm">
                  <TabsTrigger
                    value="india"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 transition-all"
                  >
                    India
                  </TabsTrigger>

                  <TabsTrigger
                    value="usa"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 transition-all"
                  >
                    USA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="india" className="space-y-6">
                  {renderSubscriptionTable(
                    filteredAndSortedSubscriptions,
                    "India"
                  )}
                </TabsContent>

                <TabsContent value="usa" className="space-y-6">
                  {renderSubscriptionTable(
                    filteredAndSortedSubscriptions,
                    "USA"
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="transactions">
              <Tabs
                value={activeRegionTab}
                onValueChange={(v) => setActiveRegionTab(v as "india" | "usa")}
              >
                <TabsList className="rounded-2xl bg-muted p-1 flex w-fit mx-auto shadow-sm">
                  <TabsTrigger
                    value="india"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 transition-all"
                  >
                    India
                  </TabsTrigger>

                  <TabsTrigger
                    value="usa"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 transition-all"
                  >
                    USA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="india" className="space-y-6">
                  {renderTransactionTable(
                    filteredAndSortedTransactions,
                    "India"
                  )}
                </TabsContent>

                <TabsContent value="usa" className="space-y-6">
                  {renderTransactionTable(filteredAndSortedTransactions, "USA")}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
