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
import { Search, ArrowUpDown, RotateCcw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import clsx from "clsx";

// DateRangePicker Component (copy this once into your project)
import { DateRangePicker } from "@/components/ui/date-range-picker"; // ← Create this file

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
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "datetime",
    direction: "desc",
  });

  // Sidebar persistence
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Fetch transactions
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

  const resetAllFilters = () => {
    setSearchTerm("");
    setPlanFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const uniquePlanIds = useMemo(() => {
    const set = new Set<string>();
    allTransactions.forEach((t) => t.plan_id && set.add(t.plan_id));
    return Array.from(set);
  }, [allTransactions]);

  const displayedTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term) ||
          t.plan_id?.toLowerCase().includes(term)
      );
    }

    // Plan filter
    if (planFilter && planFilter !== "all") {
      filtered = filtered.filter((t) => t.plan_id === planFilter);
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((t) => {
        if (!t.datetime) return false;
        const txnDate = new Date(t.datetime);
        txnDate.setHours(0, 0, 0, 0);

        const from = dateRange.from
          ? new Date(dateRange.from.setHours(0, 0, 0, 0))
          : null;
        const to = dateRange.to
          ? new Date(dateRange.to.setHours(23, 59, 59, 999))
          : null;

        return (!from || txnDate >= from) && (!to || txnDate <= to);
      });
    }

    // Sorting
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
  }, [allTransactions, searchTerm, planFilter, dateRange, sortConfig]);

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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Tabs + Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold">All Transactions</h1>
              <Tabs
                value={activeRegionTab}
                onValueChange={(v) => setActiveRegionTab(v as any)}
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="india">India</TabsTrigger>
                  <TabsTrigger value="usa">USA</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Modern Filter Bar */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email, plan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>

                  <Select
                    value={planFilter}
                    onValueChange={setPlanFilter}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full sm:w-56">
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

                  <DateRangePicker
                    date={dateRange}
                    onDateChange={setDateRange}
                  />

                  <Button
                    variant="outline"
                    onClick={resetAllFilters}
                    disabled={loading}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  // Beautiful skeleton loader (restored + enhanced)
                  <div className="space-y-4 p-6">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 animate-pulse"
                      >
                        <div className="h-10 bg-muted rounded w-1/5" />
                        <div className="h-10 bg-muted rounded flex-1" />
                        <div className="h-10 bg-muted rounded w-32" />
                        <div className="h-10 bg-muted rounded w-32" />
                        <div className="h-10 bg-muted rounded w-24 ml-auto" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-20 text-destructive text-lg">
                    {error}
                  </div>
                ) : displayedTransactions.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <p className="text-xl">No transactions found</p>
                    <p className="text-sm mt-2">Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
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
                    <div className="px-6 py-4 text-sm text-muted-foreground border-t bg-muted/5">
                      Showing {displayedTransactions.length.toLocaleString()}{" "}
                      transaction(s)
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
