"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";
import clsx from "clsx";

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

interface ApiResponse {
  success: boolean;
  data?: Subscription[];
  error?: string;
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
  const [activeTab, setActiveTab] = useState<"india" | "usa">("india");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

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
    const fetchSubscriptions = async () => {
      setTabLoading(true);
      setError(null);

      try {
        const endpoint =
          activeTab === "india"
            ? "/api/billing/subscription/india"
            : "/api/billing/subscription/usa";

        const response = await fetch(endpoint);
        const result: ApiResponse = await response.json();

        if (result.success && result.data) {
          setSubscriptions(result.data);
        } else {
          setError(result.error || "Failed to fetch subscriptions");
          setSubscriptions([]);
        }
      } catch (err) {
        setError("Network error occurred");
        setSubscriptions([]);
      } finally {
        setTabLoading(false);
      }
    };

    fetchSubscriptions();
  }, [activeTab]);

  if (loading) return <Loader />;

  // -----------------------------
  // Helpers
  // -----------------------------
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

  // -----------------------------
  // Table Renderer
  // -----------------------------
  const renderSubscriptionTable = (
    data: Subscription[],
    region: "India" | "USA"
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{region} Subscriptions</CardTitle>
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
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan ID</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.username || "—"}</TableCell>
                  <TableCell>{row.email || "—"}</TableCell>
                  <TableCell>{row.plan_id || "—"}</TableCell>
                  <TableCell>{formatDate(row.datetime)}</TableCell>
                  <TableCell>
                    {formatAmount(row.final_amount, region)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  // -----------------------------
  // Return UI
  // -----------------------------
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
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "india" | "usa")}
          >
            {/* Tabs */}
            <TabsList>
              <TabsTrigger value="india">India</TabsTrigger>
              <TabsTrigger value="usa">USA</TabsTrigger>
            </TabsList>

            {/* India */}
            <TabsContent value="india" className="space-y-6">
              {renderSubscriptionTable(subscriptions, "India")}
            </TabsContent>

            {/* USA */}
            <TabsContent value="usa" className="space-y-6">
              {renderSubscriptionTable(subscriptions, "USA")}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
