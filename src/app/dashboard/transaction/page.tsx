// app/transactions-all/page.tsx
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import clsx from "clsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // ← Fixed import!

interface Transaction {
  name: string;
  email: string;
  plan_id: string | null;
  final_amount: any;
  datetime: string;
}

interface SortConfig {
  key: keyof Transaction | "amount";
  direction: "asc" | "desc";
}

export default function AllTransactionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegionTab, setActiveRegionTab] = useState<"india" | "usa">(
    "india"
  );

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ plan_id: "", date: "" });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "datetime",
    direction: "desc",
  });

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Fetch and flatten
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          activeRegionTab === "india"
            ? "/api/billing/transactions/india"
            : "/api/billing/transactions/usa";

        const res = await fetch(endpoint);
        const groupedData = await res.json();

        if (!Array.isArray(groupedData)) throw new Error("Invalid data");

        const flat: Transaction[] = groupedData.flatMap((user: any) =>
          user.transactions.map((txn: any) => ({
            name: user.name || "—",
            email: user.email,
            plan_id: txn.plan_id || null,
            final_amount: txn.final_amount,
            datetime: txn.datetime,
          }))
        );

        setAllTransactions(flat);
      } catch (err) {
        setError("Failed to load transactions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [activeRegionTab]);

  const formatDate = (dateStr: string) =>
    !dateStr
      ? "—"
      : new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  const formatAmount = (amount: any, region: "India" | "USA") => {
    if (amount == null) return region === "India" ? "₹0.00" : "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return region === "India" ? "₹0.00" : "$0.00";
    return region === "India" ? `₹${num.toFixed(2)}` : `$${num.toFixed(2)}`;
  };

  const handleSort = (key: keyof Transaction | "amount") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setFilters({ plan_id: "", date: "" });
    setSearchTerm("");
  };

  const uniquePlanIds = useMemo(() => {
    const set = new Set<string>();
    allTransactions.forEach((t) => t.plan_id && set.add(t.plan_id));
    return Array.from(set);
  }, [allTransactions]);

  const displayedTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.email.toLowerCase().includes(lower) ||
          t.plan_id?.toLowerCase().includes(lower)
      );
    }

    if (filters.plan_id && filters.plan_id !== "all") {
      filtered = filtered.filter((t) => t.plan_id === filters.plan_id);
    }
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(
        (t) => new Date(t.datetime).toDateString() === filterDate
      );
    }

    filtered.sort((a, b) => {
      let aVal: any =
        sortConfig.key === "amount" ? a.final_amount : a[sortConfig.key];
      let bVal: any =
        sortConfig.key === "amount" ? b.final_amount : b[sortConfig.key];

      if (sortConfig.key === "amount") {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      } else if (sortConfig.key === "datetime") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = String(aVal ?? "");
        bVal = String(bVal ?? "");
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [allTransactions, searchTerm, filters, sortConfig]);

  const regionLabel = activeRegionTab === "india" ? "India" : "USA";

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
          title="All Transactions"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
          <Card className="max-w-7xl mx-auto">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-2xl">All Transactions</CardTitle>

                <Tabs
                  value={activeRegionTab}
                  onValueChange={(v) => setActiveRegionTab(v as any)}
                >
                  <TabsList className="grid grid-cols-2 w-fit">
                    <TabsTrigger value="india">India</TabsTrigger>
                    <TabsTrigger value="usa">USA</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading}>
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4 bg-background border shadow-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Plan ID</label>
                        <Select
                          value={filters.plan_id}
                          onValueChange={(v) =>
                            setFilters({ ...filters, plan_id: v })
                          }
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Plans" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            {uniquePlanIds.map((id) => (
                              <SelectItem key={id} value={id}>
                                {id}
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
                          disabled={loading}
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
              {loading ? (
                // Beautiful Shadcn-style skeleton
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-4 animate-pulse"
                    >
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-28"></div>
                      <div className="h-4 bg-muted rounded w-20 ml-auto"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  {error}
                </div>
              ) : displayedTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("name")}
                            >
                              Name <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("email")}
                            >
                              Email <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("plan_id")}
                            >
                              Plan ID <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("datetime")}
                            >
                              Date <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("amount")}
                            >
                              Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedTransactions.map((txn, i) => (
                          <TableRow key={`${txn.email}-${txn.datetime}-${i}`}>
                            <TableCell className="font-medium">
                              {txn.name}
                            </TableCell>
                            <TableCell>{txn.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {txn.plan_id || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(txn.datetime)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatAmount(
                                txn.final_amount,
                                regionLabel as any
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="text-center text-sm text-muted-foreground mt-6">
                    Showing {displayedTransactions.length.toLocaleString()}{" "}
                    transaction(s)
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
