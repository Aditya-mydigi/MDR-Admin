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
import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeRegionTab, setActiveRegionTab] = useState<"india" | "usa">(
    "india"
  );

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allTransactions, setAllTransactions] = useState<GroupedUser[]>([]); // Keep for expand

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

  // Sidebar collapse persistence
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Fetch both subscriptions + transactions when region changes
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
          setSubscriptions(subJson.data || []);
        } else {
          setSubscriptions([]);
        }

        if (Array.isArray(txnJson)) {
          setAllTransactions(txnJson);
        } else {
          setAllTransactions([]);
        }
      } catch (err) {
        setError("Failed to load data");
        setSubscriptions([]);
        setAllTransactions([]);
      } finally {
        setTabLoading(false);
      }
    };

    fetchData();
  }, [activeRegionTab]);

  // Helpers
  const resetFilters = () => {
    setFilters({ plan_id: "", date: "" });
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
    if (amount === null || amount === undefined)
      return region === "India" ? "₹0.00" : "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return region === "India" ? "₹0.00" : "$0.00";
    return region === "India" ? `₹${num.toFixed(2)}` : `$${num.toFixed(2)}`;
  };

  const toggleRow = (email: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getUserTransactions = (email: string): Transaction[] => {
    const user = allTransactions.find((u) => u.email === email);
    return user?.transactions || [];
  };

  // Filter & sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.plan_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.plan_id && filters.plan_id !== "all") {
      filtered = filtered.filter((s) => s.plan_id === filters.plan_id);
    }
    if (filters.date) {
      filtered = filtered.filter((s) => {
        if (!s.datetime) return false;
        return (
          new Date(s.datetime).toDateString() ===
          new Date(filters.date).toDateString()
        );
      });
    }

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Subscription];
      const bVal = b[sortConfig.key as keyof Subscription];
      if (aVal === null || bVal === null) return 0;

      if (sortConfig.key === "final_amount") {
        const aNum = parseFloat(aVal as string) || 0;
        const bNum = parseFloat(bVal as string) || 0;
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      if (sortConfig.key === "datetime") {
        return sortConfig.direction === "asc"
          ? new Date(aVal as string).getTime() -
              new Date(bVal as string).getTime()
          : new Date(bVal as string).getTime() -
              new Date(aVal as string).getTime();
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return filtered;
  }, [subscriptions, searchTerm, sortConfig, filters]);

  const uniquePlanIds = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => s.plan_id && set.add(s.plan_id));
    allTransactions.forEach((u) =>
      u.transactions.forEach((t) => t.plan_id && set.add(t.plan_id))
    );
    return Array.from(set);
  }, [subscriptions, allTransactions]);

  // Table Renderer
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
              placeholder="Search..."
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
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, plan_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      {uniquePlanIds.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
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
                      setFilters((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
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
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">No subscriptions found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("username")}
                  >
                    Username <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("email")}>
                    Email <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("plan_id")}>
                    Plan ID <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("datetime")}
                  >
                    Latest Payment <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("final_amount")}
                  >
                    Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((sub) => (
                <React.Fragment key={sub.email}>
                  {/* Main Row */}
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(sub.email)}
                      >
                        {expandedRows.has(sub.email) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{sub.username || "—"}</TableCell>
                    <TableCell>{sub.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.plan_id || "—"}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(sub.datetime)}</TableCell>
                    <TableCell>
                      {formatAmount(sub.final_amount, region)}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Transactions */}
                  {expandedRows.has(sub.email) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="pl-10 py-4">
                          {getUserTransactions(sub.email).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No transaction history
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Plan ID</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getUserTransactions(sub.email).map(
                                  (txn, i) => (
                                    <TableRow key={i}>
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
                                  )
                                )}
                              </TableBody>
                            </Table>
                          )}
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
          title="Subscriptions"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
          <Tabs
            value={activeRegionTab}
            onValueChange={(v) => setActiveRegionTab(v as "india" | "usa")}
          >
            <TabsList className="grid w-64 mx-auto grid-cols-2 rounded-xl bg-muted p-1">
              <TabsTrigger
                value="india"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow"
              >
                India
              </TabsTrigger>
              <TabsTrigger
                value="usa"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow"
              >
                USA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="india" className="mt-8">
              {renderSubscriptionTable(filteredAndSortedSubscriptions, "India")}
            </TabsContent>

            <TabsContent value="usa" className="mt-8">
              {renderSubscriptionTable(filteredAndSortedSubscriptions, "USA")}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
