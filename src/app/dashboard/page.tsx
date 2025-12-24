"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Filter,
  MoreVertical,
  ArrowUpDown,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// ---------- Type Definitions ----------
interface TrendData {
  day: string;
  value: number;
}

interface KpiItem {
  label: string;
  value: string;
  change: string;
  changeType: string;
  trend: TrendData[];
}

interface KpiData {
  activeUsers: KpiItem;
  newSignups: KpiItem;
  totalRecords: KpiItem;
  revenue: KpiItem;
  appointments: KpiItem;
  systemErrors: KpiItem;
}

// ---------- Static table data (unchanged) ----------
const tableData = [
  {
    id: "7365936578",
    username: "Dr.Saroj Gupta",
    email: "test121@gmail.com",
    phone: "+91 924767845",
    date: "9/19/2025",
    gender: "Female",
    bloodGroup: "O+ve",
    planBuy: "1 Year",
    daysLeft: 30,
    status: "Active",
  },
  {
    id: "5223868576",
    username: "Rahul Pundir",
    email: "test121@gmail.com",
    phone: "+91 924767845",
    date: "9/19/2025",
    gender: "Male",
    bloodGroup: "B-ve",
    planBuy: "1 Year",
    daysLeft: 1,
    status: "Active",
  },
  {
    id: "5282564256",
    username: "Manpreet Sin...",
    email: "test121@gmail.com",
    phone: "",
    date: "9/19/2025",
    gender: "Male",
    bloodGroup: "AB+ve",
    planBuy: "No Plan",
    daysLeft: "-",
    status: "Inactive",
  },
  {
    id: "5582756287",
    username: "Hemant",
    email: "test121@gmail.com",
    phone: "",
    date: "9/19/2025",
    gender: "Male",
    bloodGroup: "AB+ve",
    planBuy: "2 year",
    daysLeft: "-",
    status: "Inactive",
  },
];

// ---------- Area chart data (unchanged) ----------
const areaChartData = [
  { date: "Apr 15", visitors: 4500, prev: 4200 },
  { date: "Apr 20", visitors: 5200, prev: 4800 },
  { date: "Apr 25", visitors: 4800, prev: 4400 },
  { date: "Apr 30", visitors: 5500, prev: 5100 },
  { date: "May 5", visitors: 6000, prev: 5600 },
  { date: "May 10", visitors: 5800, prev: 5400 },
  { date: "May 15", visitors: 6500, prev: 6100 },
  { date: "May 20", visitors: 7000, prev: 6600 },
  { date: "May 25", visitors: 6800, prev: 6400 },
  { date: "May 30", visitors: 7500, prev: 7100 },
  { date: "Jun 5", visitors: 8000, prev: 7600 },
  { date: "Jun 10", visitors: 7800, prev: 7400 },
  { date: "Jun 15", visitors: 8500, prev: 8100 },
  { date: "Jun 20", visitors: 9000, prev: 8600 },
  { date: "Jun 25", visitors: 8800, prev: 8400 },
  { date: "Jun 30", visitors: 9500, prev: 9100 },
];

// ---------- Initial KPI data ----------
const initialKpiData: KpiData = {
  activeUsers: {
    label: "Active Users (DAU)",
    value: "--",
    change: "+0%",
    changeType: "positive",
    trend: [],
  },
  newSignups: {
    label: "New Signups",
    value: "--",
    change: "+0%",
    changeType: "positive",
    trend: [],
  },
  totalRecords: {
    label: "Total Records Created",
    value: "--",
    change: "+0%",
    changeType: "positive",
    trend: [],
  },
  revenue: {
    label: "Revenue (MTD)",
    value: "--",
    change: "+0%",
    changeType: "positive",
    trend: [],
  },
  appointments: {
    label: "Appointments Today",
    value: "320",
    change: "+5.6%",
    changeType: "positive",
    trend: [
      { day: "Mon", value: 280 },
      { day: "Tue", value: 290 },
      { day: "Wed", value: 300 },
      { day: "Thu", value: 310 },
      { day: "Fri", value: 315 },
      { day: "Sat", value: 318 },
      { day: "Sun", value: 320 },
    ],
  },
  systemErrors: {
    label: "System Errors",
    value: "4",
    change: "-67%",
    changeType: "negative",
    trend: [
      { day: "Mon", value: 12 },
      { day: "Tue", value: 10 },
      { day: "Wed", value: 8 },
      { day: "Thu", value: 6 },
      { day: "Fri", value: 5 },
      { day: "Sat", value: 4 },
      { day: "Sun", value: 4 },
    ],
  },
};

const calculateChange = (current: number, previous: number) => {
  if (!previous || previous === 0) return "0%";
  const diff = ((current - previous) / previous) * 100;
  const formatted = diff.toFixed(1);
  return `${diff >= 0 ? "+" : ""}${formatted}%`;
};

// ---------- Helper to generate synthetic trend data ----------
const generateTrend = (baseValue: number, key: string): TrendData[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const isRevenue = key === "revenue";
  return days.map((day, i) => {
    const variation = isRevenue ? 0.05 : 0.1;
    const factor = 1 + Math.random() * variation * (i % 2 === 0 ? 1 : -1);
    return {
      day,
      value: isRevenue
        ? Number((baseValue * factor).toFixed(2))
        : Math.round(baseValue * factor),
    };
  });
};

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [kpiData, setKpiData] = useState<KpiData>(initialKpiData);
  const [region, setRegion] = useState<"Total" | "India" | "USA">("Total");

  /* Load sidebar state from localStorage */
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
  }, []);

  /* Save sidebar state to localStorage */
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  /* Fetch dashboard stats and update KPI cards */
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        const payload = await res.json();
        if (!mounted) return;
        if (payload && payload.success && payload.stats && payload.changes) {
          const s = payload.stats;
          const c = payload.changes;
          // Helper: format numbers with commas
          const nf = (n: any): string => {
            if (n === null || n === undefined) return "--";
            if (typeof n === "number") return n.toLocaleString();
            return String(n);
          };
          // Format revenue: show currency with 2 decimals

          const formatCurrency = (
            n: any,
            region: "Total" | "India" | "USA"
          ): string => {
            if (n === null || n === undefined) return "--";

            let num = typeof n === "number" ? n : parseFloat(n);
            if (isNaN(num)) return String(n);

            const rounded = Math.round(num);

            // OPTION 1:
            // "Total" should always show INDIAN currency (₹)
            if (region === "Total") {
              return `₹${rounded.toLocaleString("en-IN")}`;
            }

            // India → ₹
            if (region === "India") {
              return `₹${rounded.toLocaleString("en-IN")}`;
            }

            // USA → $
            if (region === "USA") {
              return `$${rounded.toLocaleString("en-US")}`;
            }

            return "--";
          };

          // Update KPI data based on region
          // Even better - handle the data structure explicitly
          const updateKpiData = (): KpiData => {
            let active, newSignups, users, monthlyRevenue;

            if (region === "Total") {
              active = s.activeUsers;
              newSignups = s.newSignupsThisMonth;
              users = s.totalUsers;
              monthlyRevenue = s.revenue?.thisMonth;
            } else if (region === "India") {
              active = s.breakdown.india.active;
              newSignups = s.breakdown.india.newSignups;
              users = s.breakdown.india.users;
              monthlyRevenue = s.breakdown.india.monthlyRevenue;
            } else {
              // USA
              active = s.breakdown.usa.active;
              newSignups = s.breakdown.usa.newSignups;
              users = s.breakdown.usa.users;
              monthlyRevenue = s.breakdown.usa.monthlyRevenue;
            }

            return {
              ...initialKpiData,
              activeUsers: {
                ...initialKpiData.activeUsers,
                value: nf(active),
                change: c.activeUsers.change,
                changeType: c.activeUsers.changeType,
                trend: generateTrend(active || 1000, "activeUsers"),
              },
              newSignups: {
                ...initialKpiData.newSignups,
                value: nf(newSignups),
                change: c.newSignups.change,
                changeType: c.newSignups.changeType,
                trend: generateTrend(newSignups || 200, "newSignups"),
              },
              totalRecords: {
                ...initialKpiData.totalRecords,
                value: nf(users),
                change: c.totalRecords.change,
                changeType: c.totalRecords.changeType,
                trend: generateTrend(users || 5000, "totalRecords"),
              },
              revenue: {
                ...initialKpiData.revenue,
                // Pass the region to formatCurrency
                value: formatCurrency(monthlyRevenue, region),
                change: c.revenue.change,
                changeType: c.revenue.changeType,
                trend: generateTrend(monthlyRevenue || 1000, "revenue"),
              },
              appointments: initialKpiData.appointments,
              systemErrors: initialKpiData.systemErrors,
            };
          };
          setKpiData(updateKpiData());
          setLoading(false);
        } else {
          console.warn(
            "Dashboard API returned no stats or success=false",
            payload
          );
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setLoading(false);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [region]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(tableData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    }
  };

  if (loading) return <Loader />;

  const colorFor = (key: string, changeType: string | undefined) => {
    if (key === "systemErrors") return "#ef4444"; // red
    if (changeType === "positive") return "#16a34a"; // green
    return "#f59e0b"; // yellow/orange
  };

  return (
    <div
      className={clsx(
        "h-screen bg-white flex overflow-hidden",
        sidebarOpen && "overflow-hidden"
      )}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 bg-white">
        <Header
          title="Dashboard"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#f8fafc]">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a3a7a] to-[#02b8f2] p-8 text-white shadow-xl shadow-[#0a3a7a]/10">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back, Admin!</h2>
              <p className="text-white/80 max-w-xl">
                Here's what's happening across India and USA today. Track metrics, manage users, and monitor system health from one central hub.
              </p>
            </div>
            {/* Decorative background circles */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] left-[20%] w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          </div>

          {/* Region Toggle Buttons */}
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-2xl w-fit shadow-sm">
            <button
              onClick={() => setRegion("Total")}
              className={clsx(
                "px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl",
                region === "Total" 
                  ? "bg-[#0a3a7a] text-white shadow-lg shadow-[#0a3a7a]/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              Total Oversight
            </button>
            <button
              onClick={() => setRegion("India")}
              className={clsx(
                "px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl",
                region === "India" 
                  ? "bg-[#0a3a7a] text-white shadow-lg shadow-[#0a3a7a]/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              India Region
            </button>
            <button
              onClick={() => setRegion("USA")}
              className={clsx(
                "px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl",
                region === "USA" 
                  ? "bg-[#0a3a7a] text-white shadow-lg shadow-[#0a3a7a]/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              USA Region
            </button>
          </div>
          {/* Six KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(kpiData).map(([key, data]) => (
              <Card
                key={key}
                className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                style={{ borderRadius: 10 }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm text-gray-600 font-medium">
                      {data.label}
                    </p>
                  </div>
                  <div className="flex justify-between items-end mb-3">
                    <p
                      className={clsx(
                        "text-3xl font-bold",
                        typeof data.value === "string" &&
                          /^\d/.test(String(data.value))
                          ? ""
                          : "text-gray-900"
                      )}
                    >
                      {data.value}
                    </p>
                    <span
                      className={clsx(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        data.changeType === "positive"
                          ? "text-green-600 bg-green-50"
                          : "text-yellow-600 bg-yellow-50"
                      )}
                    >
                      {data.change} from last month
                    </span>
                  </div>
                  <div className="h-[55px] -mx-2 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.trend}
                        margin={{ top: 5, right: 6, left: 6, bottom: 5 }}
                      >
                        <XAxis dataKey="day" hide />
                        <YAxis hide domain={["dataMin", "dataMax"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={colorFor(key, data.changeType)}
                          strokeWidth={2.5}
                          dot={{
                            r: 3.2,
                            strokeWidth: 2,
                            stroke: colorFor(key, data.changeType),
                            fill: "#ffffff",
                          }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Data Table Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="Filter tasks..."
                  className="flex-1 min-w-[200px] max-w-[300px]"
                />
                <Button variant="outline" size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Status
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Priority
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-12 px-4">
                        <Checkbox
                          checked={
                            selectedRows.length === tableData.length &&
                            tableData.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          ID
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Username
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Email/Phone No.
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Date
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Gender
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Blood Group
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Plan Buy
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Days Left
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Status
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </TableHead>
                      <TableHead className="w-12 px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-gray-50 border-b"
                      >
                        <TableCell className="px-4 py-3">
                          <Checkbox
                            checked={selectedRows.includes(row.id)}
                            onCheckedChange={(checked) =>
                              handleSelectRow(row.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium text-sm">
                          {row.id}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {row.username}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm">
                            <div>{row.email}</div>
                            {row.phone && (
                              <div className="text-gray-500 text-xs">
                                {row.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {row.date}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {row.gender}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {row.bloodGroup}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {row.planBuy}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {row.daysLeft === "-" ? (
                            <span className="text-gray-400 text-sm">-</span>
                          ) : (
                            <span
                              className={clsx(
                                "px-2 py-1 rounded text-xs font-medium",
                                typeof row.daysLeft === "number" &&
                                  row.daysLeft <= 1
                                  ? "bg-red-100 text-red-700"
                                  : typeof row.daysLeft === "number" &&
                                    row.daysLeft <= 10
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              )}
                            >
                              {row.daysLeft}{" "}
                              {typeof row.daysLeft === "number" &&
                              row.daysLeft === 1
                                ? "Day"
                                : "Days"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={clsx(
                              "px-2 py-1 rounded text-xs font-medium",
                              row.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {selectedRows.length} of {tableData.length} row(s) selected.
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Rows per page 10</SelectItem>
                      <SelectItem value="20">Rows per page 20</SelectItem>
                      <SelectItem value="50">Rows per page 50</SelectItem>
                      <SelectItem value="100">Rows per page 100</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of{" "}
                    {Math.ceil(tableData.length / pageSize)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            Math.ceil(tableData.length / pageSize),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        currentPage === Math.ceil(tableData.length / pageSize)
                      }
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        setCurrentPage(Math.ceil(tableData.length / pageSize))
                      }
                      disabled={
                        currentPage === Math.ceil(tableData.length / pageSize)
                      }
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Area Chart Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Area Chart - Interactive
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing total visitors for the last 3 months
                  </p>
                </div>
                <Select defaultValue="3months">
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Last 3 months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Last 1 month</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last 1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={areaChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorVisitors"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#06b6d4"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#06b6d4"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorPrev"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                    />
                    <Area
                      type="monotone"
                      dataKey="prev"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPrev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
