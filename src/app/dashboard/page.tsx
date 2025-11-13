"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Filter,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/* ------------------- Helper Interfaces ------------------- */
interface User {
  id: string;
  mdr_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_num: string | null;
  gender: string | null;
  blood_group: string | null;
  created_at: string;
  plan_id: string | null;
  expiry_date: string | null;
  user_plan_active: boolean;
}

/* ------------------- Utility Functions ------------------- */
const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const getDaysLeft = (expiryDate: string | null) => {
  if (!expiryDate) return "-";
  const today = new Date();
  const exp = new Date(expiryDate);
  const diff = Math.ceil(
    (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff <= 0 ? 0 : diff;
};

// Mini 7-day trend for KPI cards
const generate7DayTrend = (baseValue: number) =>
  Array.from({ length: 7 }).map((_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    value: baseValue + Math.floor(Math.random() * 100 - 50),
  }));

// Monthly 6-month trend for area chart
const build6MonthTrend = (currentValue: number) => {
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString("en-US", { month: "short" });
  });
  const base = Math.max(0, Math.round(currentValue));
  return months.map((label, idx) => ({
    month: label,
    value: Math.round(base * (0.7 + idx * 0.05)),
  }));
};

/* ------------------- Dashboard Component ------------------- */
export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<any | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  /* ------------------- Fetch Dashboard ------------------- */
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed");
        setDashboardData(json.stats);
      } catch {
        setErrorDashboard("Failed to load dashboard data");
      } finally {
        setLoadingDashboard(false);
      }
    }
    loadDashboard();
  }, []);

  /* ------------------- Fetch Users ------------------- */
  const fetchUsers = async (page = 1) => {
    try {
      const q = new URLSearchParams();
      q.set("page", String(page));
      q.set("limit", String(pageSize));
      if (searchTerm) q.set("search", searchTerm);
      const res = await fetch(`/api/users?${q.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error("Failed to fetch users");
      setUsers(json.users || []);
      setTotalPages(json.totalPages || 1);
      setTotalCount(json.total || 0);
      setCurrentPage(page);
    } catch {
      setErrorUsers("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [pageSize, searchTerm, currentPage]);

  /* ------------------- Sidebar ------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved) setSidebarCollapsed(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  /* ------------------- Table Selection ------------------- */
  const handleSelectAll = (checked: boolean) =>
    setSelectedRows(checked ? users.map((u) => u.id) : []);
  const handleSelectRow = (id: string, checked: boolean) =>
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((r) => r !== id)
    );

  /* ------------------- KPI Cards ------------------- */
  const kpiCards = useMemo(() => {
    if (!dashboardData) return [];
    return [
      {
        key: "activeUsers",
        label: "Active Users (DAU)",
        value: dashboardData.activeUsers ?? 0,
        change: "+5.6%",
        trend: generate7DayTrend(dashboardData.activeUsers / 7),
      },
      {
        key: "newSignups",
        label: "New Signups (This Month)",
        value: dashboardData.newSignupsThisMonth ?? 0,
        change: "+2.3%",
        trend: generate7DayTrend(dashboardData.newSignupsThisMonth / 7),
      },
      {
        key: "totalRecords",
        label: "Total Records Created",
        value: dashboardData.totalUsers ?? 0,
        change: "+12%",
        trend: generate7DayTrend(dashboardData.totalUsers / 7),
      },
      {
        key: "revenue",
        label: "Revenue (MTD)",
        value: dashboardData.revenue?.thisMonth ?? 0,
        change: "+9%",
        trend: generate7DayTrend(dashboardData.revenue?.thisMonth / 1000),
      },
    ];
  }, [dashboardData]);

  /* ------------------- India vs USA Chart ------------------- */
  const indiaUsaSeries = useMemo(() => {
    if (!dashboardData?.breakdown) return [];
    const india = build6MonthTrend(dashboardData.breakdown.india?.active || 0);
    const usa = build6MonthTrend(dashboardData.breakdown.usa?.active || 0);
    return india.map((m, i) => ({
      month: m.month,
      india: m.value,
      usa: usa[i]?.value ?? 0,
    }));
  }, [dashboardData]);

  // ✅ Range Selector
  const [selectedRange, setSelectedRange] = useState("3months");
  const displayedSeries = useMemo(() => {
    if (!indiaUsaSeries.length) return [];
    const totalMonths =
      selectedRange === "3months"
        ? 3
        : selectedRange === "6months"
          ? 6
          : 12;
    return Array.from({ length: totalMonths }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (totalMonths - 1 - i));
      const month = d.toLocaleString("en-US", { month: "short" });
      const indiaVal =
        indiaUsaSeries[i % indiaUsaSeries.length]?.india +
        Math.floor(Math.random() * 100 - 50);
      const usaVal =
        indiaUsaSeries[i % indiaUsaSeries.length]?.usa +
        Math.floor(Math.random() * 100 - 50);
      return { month, india: indiaVal, usa: usaVal };
    });
  }, [indiaUsaSeries, selectedRange]);

  /* ------------------- Loading / Error ------------------- */
  if (loadingDashboard || loadingUsers) return <Loader />;
  if (errorDashboard || errorUsers)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 font-medium">
        {errorDashboard || errorUsers}
      </div>
    );

  /* ------------------- Render ------------------- */
  return (
    <div className={clsx("min-h-screen bg-white flex")}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <Header
          title="Dashboard"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((card) => (
              <Card key={card.key} className="border border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    {card.label}
                  </p>
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-3xl font-bold text-gray-900">
                      {card.key === "revenue"
                        ? `₹${card.value.toLocaleString()}`
                        : card.value.toLocaleString()}
                    </p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-green-600 bg-green-50">
                      {card.change}
                    </span>
                  </div>
                  <div className="h-[50px] -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={card.trend}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Tooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Table */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="Filter users..."
                  className="flex-1 min-w-[200px] max-w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" /> View
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto" style={{ maxHeight: "280px" }}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-12 px-4 font-bold">
                        <Checkbox
                          checked={
                            selectedRows.length === users.length &&
                            users.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      {[
                        "ID",
                        "Username",
                        "Email/Phone No.",
                        "Date",
                        "Gender",
                        "Blood Group",
                        "Plan Buy",
                        "Days Left",
                        "Status",
                      ].map((head) => (
                        <TableHead
                          key={head}
                          className="px-4 py-3 text-xs font-bold text-gray-700"
                        >
                          {head}
                        </TableHead>
                      ))}
                      <TableHead className="w-12 px-4"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map((user) => {
                      const daysLeft = getDaysLeft(user.expiry_date);
                      return (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell className="px-4 py-3">
                            <Checkbox
                              checked={selectedRows.includes(user.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(user.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm font-medium">
                            {user.mdr_id}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            <div>
                              <div>{user.email}</div>
                              {user.phone_num && (
                                <div className="text-xs text-gray-500">
                                  {user.phone_num}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            {user.gender ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            {user.blood_group ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">
                            {user.plan_id ?? "No Plan"}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {daysLeft === "-" ? (
                              <span className="text-gray-400 text-sm">-</span>
                            ) : (
                              <span
                                className={clsx(
                                  "px-2 py-1 rounded text-xs font-medium",
                                  daysLeft <= 1
                                    ? "bg-red-100 text-red-700"
                                    : daysLeft <= 10
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-green-100 text-green-700"
                                )}
                              >
                                {daysLeft} {daysLeft === 1 ? "Day" : "Days"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span
                              className={clsx(
                                "px-2 py-1 rounded text-xs font-medium",
                                user.user_plan_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              )}
                            >
                              {user.user_plan_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination (client-side only) */}
              <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {selectedRows.length} of {totalCount} selected.
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-2 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Section */}
          <div className="mt-6 w-full flex justify-start">
            <div className="w-full lg:w-3/4">
              <Card className="border border-gray-200 shadow-sm h-full w-full">
                <CardHeader className="pb-4 border-b flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Area Chart - Interactive
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Showing total visitors for the selected duration
                    </p>
                  </div>
                  <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value)}>
                    <SelectTrigger className="w-[140px] h-8 text-sm">
                      <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                      <SelectItem value="6months">Last 6 months</SelectItem>
                      <SelectItem value="12months">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>

                <CardContent className="pt-6 pb-2">
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: "3 / 1", maxHeight: "230px" }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={displayedSeries}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorIndia" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="colorUsa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} tickMargin={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Area type="monotone" dataKey="india" stroke="#06b6d4" strokeWidth={2.2} fill="url(#colorIndia)" animationDuration={800} />
                        <Area type="monotone" dataKey="usa" stroke="#f97316" strokeWidth={2.2} fill="url(#colorUsa)" animationDuration={800} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
