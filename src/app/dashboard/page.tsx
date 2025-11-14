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

// ---------- STATIC trend data (unchanged) ----------
const staticTrends = {
  activeUsers: [
    { day: "Mon", value: 11000 },
    { day: "Tue", value: 11200 },
    { day: "Wed", value: 11300 },
    { day: "Thu", value: 11500 },
    { day: "Fri", value: 11800 },
    { day: "Sat", value: 12000 },
    { day: "Sun", value: 12450 },
  ],
  newSignups: [
    { day: "Mon", value: 2200 },
    { day: "Tue", value: 2180 },
    { day: "Wed", value: 2150 },
    { day: "Thu", value: 2140 },
    { day: "Fri", value: 2130 },
    { day: "Sat", value: 2140 },
    { day: "Sun", value: 2145 },
  ],
  totalRecords: [
    { day: "Mon", value: 8500 },
    { day: "Tue", value: 8800 },
    { day: "Wed", value: 9000 },
    { day: "Thu", value: 9200 },
    { day: "Fri", value: 9400 },
    { day: "Sat", value: 9600 },
    { day: "Sun", value: 9830 },
  ],
  revenue: [
    { day: "Mon", value: 7.2 },
    { day: "Tue", value: 7.4 },
    { day: "Wed", value: 7.6 },
    { day: "Thu", value: 7.8 },
    { day: "Fri", value: 8.0 },
    { day: "Sat", value: 8.1 },
    { day: "Sun", value: 8.2 },
  ],
};

// ---------- INITIAL KPI data (values will be updated from API) ----------
const initialKpiData = {
  activeUsers: {
    label: "Active Users (DAU)",
    value: "--",
    change: "+5.6%",
    changeType: "positive",
    trend: staticTrends.activeUsers,
  },
  newSignups: {
    label: "New Signups",
    value: "--",
    change: "-2%",
    changeType: "negative",
    trend: staticTrends.newSignups,
  },
  totalRecords: {
    label: "Total Records Created",
    value: "--",
    change: "+12%",
    changeType: "positive",
    trend: staticTrends.totalRecords,
  },
  revenue: {
    label: "Revenue (MTD)",
    value: "--",
    change: "+9%",
    changeType: "positive",
    trend: staticTrends.revenue,
  },
  // static cards (unchanged)
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

// ---------- Area chart (unchanged) ----------
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

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // KPI state (we keep the entire object so trends/labels/changes remain unchanged)
  const [kpiData, setKpiData] = useState(initialKpiData);

  /* ✅ Load sidebar state from localStorage */
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
    setLoading(false);
  }, []);

  /* ✅ Save sidebar state to localStorage */
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  /* ✅ Fetch dashboard stats and update the four dynamic cards:
       - activeUsers <- stats.activeUsers
       - newSignups <- stats.newSignupsThisMonth
       - totalRecords <- stats.totalUsers (you selected Option A)
       - revenue <- stats.revenue.thisMonth (MTD)
  */
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        const payload = await res.json();
        if (!mounted) return;

        if (payload && payload.success && payload.stats) {
          const s = payload.stats;

          // Helper: format numbers with commas
          const nf = (n: any) => {
            if (n === null || n === undefined) return "--";
            if (typeof n === "number") return n.toLocaleString();
            return String(n);
          };

          // Format revenue: show currency with 2 decimals (you can tweak currency)
          const formatCurrency = (n: any) => {
            if (n === null || n === undefined) return "--";
            if (typeof n !== "number") return String(n);
            // display as plain number with grouping; you can swap currency if required
            return `₹${n.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          };

          setKpiData((prev) => ({
            ...prev,
            activeUsers: {
              ...prev.activeUsers,
              value: nf(s.activeUsers),
              // keep existing change/trend
            },
            newSignups: {
              ...prev.newSignups,
              value: nf(s.newSignupsThisMonth),
            },
            totalRecords: {
              ...prev.totalRecords,
              // Option A: totalUsers used as Total Records Created
              value: nf(s.totalUsers),
            },
            revenue: {
              ...prev.revenue,
              value:
                // prefer month number if available; fallback to total if not available
                s.revenue && typeof s.revenue.thisMonth === "number"
                  ? formatCurrency(s.revenue.thisMonth)
                  : s.revenue && typeof s.revenue.total === "number"
                  ? formatCurrency(s.revenue.total)
                  : "--",
            },
          }));
        } else {
          console.warn(
            "Dashboard API returned no stats or success=false",
            payload
          );
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

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

  // Helper: map changeType -> colors (Option A: negative -> yellow per your choice)
  const colorFor = (key: string, changeType: string | undefined) => {
    if (key === "systemErrors") return "#ef4444"; // red
    if (changeType === "positive") return "#16a34a"; // green
    // Option A: negative -> yellow like image
    return "#f59e0b"; // yellow/orange
  };

  return (
    <div
      className={clsx(
        "min-h-screen bg-white flex",
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
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {/* Six KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(kpiData).map(([key, data]) => (
              <Card
                key={key}
                className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                // match image: larger radius and lighter border/shadow
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
                      {/* For revenue we expect already formatted value like ₹x.xx */}
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

                  {/* mini line chart that matches the image */}
                  <div className="h-[55px] -mx-2 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.trend}
                        margin={{ top: 5, right: 6, left: 6, bottom: 5 }}
                      >
                        {/* no axes visible, no grid */}
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
              {/* Pagination */}
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
