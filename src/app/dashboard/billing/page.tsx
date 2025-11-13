"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  User,
} from "lucide-react";

// Static data for key metrics
const metricsData = {
  totalRevenue: {
    label: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    changeType: "positive",
    icon: <DollarSign className="h-5 w-5" />,
  },
  subscriptions: {
    label: "Subscriptions",
    value: "+2350",
    change: "+180.1%",
    changeType: "positive",
    icon: <Users className="h-5 w-5" />,
  },
  sales: {
    label: "Sales",
    value: "+12,234",
    change: "+19%",
    changeType: "positive",
    icon: <FileText className="h-5 w-5" />,
  },
  activeNow: {
    label: "Active Now",
    value: "+573",
    change: "+201 since last hour",
    changeType: "positive",
    icon: <TrendingUp className="h-5 w-5" />,
  },
};

// Bar chart data for overview - each bar needs its own color
const barChartData = [
  { month: "Jan", value: 1500, fill: "#ef4444" },
  { month: "Feb", value: 4500, fill: "#10b981" },
  { month: "Mar", value: 2500, fill: "#f59e0b" },
  { month: "Apr", value: 5000, fill: "#10b981" },
  { month: "May", value: 2000, fill: "#f59e0b" },
  { month: "Jun", value: 1500, fill: "#ef4444" },
  { month: "Jul", value: 5500, fill: "#10b981" },
  { month: "Aug", value: 4000, fill: "#10b981" },
  { month: "Sep", value: 1000, fill: "#ef4444" },
  { month: "Oct", value: 3500, fill: "#f59e0b" },
  { month: "Nov", value: 2000, fill: "#f59e0b" },
  { month: "Dec", value: 5000, fill: "#10b981" },
];

// Recent sales data
const recentSales = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "$1,999.00",
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "$39.00",
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "$299.00",
  },
  {
    name: "William Kim",
    email: "will@email.com",
    amount: "$99.00",
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "$39.00",
  },
];

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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


  if (loading) return <Loader />;

  return (
    <div className={clsx("min-h-screen bg-white flex", sidebarOpen && "overflow-hidden")}>
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 bg-white">
        <Header 
          title="Billing Details" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white border border-gray-200 p-1 h-auto">
              <TabsTrigger
                value="overview"
                className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
              >
                Reports
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
              >
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Four Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(metricsData).map(([key, data]) => (
                  <Card key={key} className="border border-gray-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600 font-medium">{data.label}</p>
                        <div className="text-gray-400">{data.icon}</div>
                      </div>
                      <div className="mb-2">
                        <p className="text-2xl font-bold text-gray-900">{data.value}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className={clsx(
                          "font-semibold",
                          data.changeType === "positive" ? "text-green-600" : "text-red-600"
                        )}>
                          {data.change}
                        </span>
                        {key === "activeNow" ? "" : " from last month"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Overview Chart and Recent Sales */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overview Bar Chart */}
                <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 6000]}
                            ticks={[0, 1500, 3000, 4500, 6000]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              padding: "8px 12px",
                            }}
                            formatter={(value: any) => `$${value.toLocaleString()}`}
                          />
                          <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                          >
                            {barChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Sales Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Recent Sales</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      You made 265 sales this month.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSales.map((sale, index) => (
                        <div key={index} className="flex items-center gap-3 pb-4 border-b last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {sale.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {sale.email}
                            </p>
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {sale.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Analytics content coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Reports content coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Notifications content coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

