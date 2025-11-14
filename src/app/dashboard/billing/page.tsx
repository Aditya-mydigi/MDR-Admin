"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";
import clsx from "clsx";

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("subscription");
  const [activeSubTab, setActiveSubTab] = useState("india");
  const [activeTxnSubTab, setActiveTxnSubTab] = useState("txnindia");

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  if (loading) return <Loader />;

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
          title="Billing Details"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-gray-200 p-1 h-auto">
              <TabsTrigger
                value="subscription"
                className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
              >
                Subscription
              </TabsTrigger>

              <TabsTrigger
                value="transactions"
                className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
              >
                Transactions
              </TabsTrigger>
            </TabsList>

            {/* -------------------------------------------------- */}
            {/*               SUBSCRIPTION SECTION                 */}
            {/* -------------------------------------------------- */}
            <TabsContent value="subscription" className="mt-6 space-y-6">
              <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                <TabsList className="bg-white border border-gray-200 p-1 h-auto">
                  <TabsTrigger
                    value="india"
                    className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
                  >
                    IN India
                  </TabsTrigger>

                  <TabsTrigger
                    value="usa"
                    className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
                  >
                    US USA
                  </TabsTrigger>
                </TabsList>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-600 font-medium">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">
                        ₹0.00
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-600 font-medium">
                        Active Users
                      </p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">0</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-600 font-medium">
                        Total Subscriptions
                      </p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">0</p>
                    </CardContent>
                  </Card>
                </div>

                {/* INDIA SUB TABLE */}
                <TabsContent value="india">
                  <Card className="border border-gray-200 shadow-sm mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        India Subscriptions
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max border-collapse">
                          <thead>
                            <tr className="text-left text-gray-600 text-sm border-b">
                              <th className="py-3">User</th>
                              <th>Email</th>
                              <th>Subscription ID</th>
                              <th>Start Date</th>
                              <th>Amount</th>
                              <th>Coupon</th>
                              <th>Transactions</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {[
                              {
                                name: "Rohan Kumar",
                                email: "rohan.k@example.com",
                              },
                              {
                                name: "Priya Sharma",
                                email: "priya.s@example.com",
                              },
                              {
                                name: "Arjun Verma",
                                email: "arjunv@example.com",
                              },
                              {
                                name: "Sneha Patel",
                                email: "snehapatel@example.com",
                              },
                              {
                                name: "Kunal Singh",
                                email: "kunalsingh@example.com",
                              },
                            ].map((row, idx) => (
                              <tr key={idx} className="text-sm border-b">
                                <td className="py-3">{row.name}</td>
                                <td>{row.email}</td>
                                <td>—</td>
                                <td>—</td>
                                <td>₹0.00</td>
                                <td>—</td>
                                <td>0</td>
                                <td>
                                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                                    Inactive
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* USA SUB TABLE */}
                <TabsContent value="usa">
                  <Card className="border border-gray-200 shadow-sm mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        USA Subscriptions
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max border-collapse">
                          <thead>
                            <tr className="text-left text-gray-600 text-sm border-b">
                              <th className="py-3">User</th>
                              <th>Email</th>
                              <th>Subscription ID</th>
                              <th>Start Date</th>
                              <th>Amount</th>
                              <th>Transactions</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {[
                              {
                                name: "John Walker",
                                email: "johnw@example.com",
                              },
                              {
                                name: "Emily Carter",
                                email: "emilyc@example.com",
                              },
                              {
                                name: "Michael Adams",
                                email: "m.adams@example.com",
                              },
                              {
                                name: "Sophia Turner",
                                email: "sophia.t@example.com",
                              },
                              {
                                name: "David Harris",
                                email: "d.harris@example.com",
                              },
                            ].map((row, idx) => (
                              <tr key={idx} className="text-sm border-b">
                                <td className="py-3">{row.name}</td>
                                <td>{row.email}</td>
                                <td>—</td>
                                <td>—</td>
                                <td>$0.00</td>
                                <td>0</td>
                                <td>
                                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                                    Inactive
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* -------------------------------------------------- */}
            {/*                  TRANSACTIONS SECTION              */}
            {/* -------------------------------------------------- */}
            <TabsContent value="transactions" className="mt-6 space-y-6">
              <Tabs value={activeTxnSubTab} onValueChange={setActiveTxnSubTab}>
                <TabsList className="bg-white border border-gray-200 p-1 h-auto">
                  <TabsTrigger
                    value="txnindia"
                    className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
                  >
                    IN India
                  </TabsTrigger>

                  <TabsTrigger
                    value="txnusa"
                    className="px-4 py-2 data-[state=active]:bg-[#0a3a7a] data-[state=active]:text-white"
                  >
                    US USA
                  </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <input
                    placeholder="Search User Name"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  />
                  <input
                    placeholder="Search Transaction ID"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  />
                  <input
                    placeholder="Search Subscription ID"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  />
                </div>

                {/* INDIA TRANSACTION TABLE */}
                <TabsContent value="txnindia">
                  <Card className="border border-gray-200 shadow-sm mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        India Transactions
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max border-collapse">
                          <thead>
                            <tr className="text-left text-gray-600 text-sm border-b">
                              <th className="py-3">User Name</th>
                              <th>Subscription ID</th>
                              <th>Transaction ID</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {[
                              { name: "Rohan Kumar", date: "2024-01-10" },
                              { name: "Priya Sharma", date: "2024-01-12" },
                              { name: "Arjun Verma", date: "2024-01-14" },
                              { name: "Sneha Patel", date: "2024-01-15" },
                              { name: "Kunal Singh", date: "2024-01-17" },
                            ].map((row, idx) => (
                              <tr key={idx} className="text-sm border-b">
                                <td className="py-3">{row.name}</td>
                                <td>—</td>
                                <td>—</td>
                                <td>{row.date}</td>
                                <td>₹0.00</td>
                                <td>
                                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                                    Failed
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* USA TRANSACTION TABLE */}
                <TabsContent value="txnusa">
                  <Card className="border border-gray-200 shadow-sm mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        USA Transactions
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max border-collapse">
                          <thead>
                            <tr className="text-left text-gray-600 text-sm border-b">
                              <th className="py-3">User Name</th>
                              <th>Subscription ID</th>
                              <th>Transaction ID</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {[
                              { name: "John Walker", date: "2024-02-01" },
                              { name: "Emily Carter", date: "2024-02-03" },
                              { name: "Michael Adams", date: "2024-02-05" },
                              { name: "Sophia Turner", date: "2024-02-06" },
                              { name: "David Harris", date: "2024-02-07" },
                            ].map((row, idx) => (
                              <tr key={idx} className="text-sm border-b">
                                <td className="py-3">{row.name}</td>
                                <td>—</td>
                                <td>—</td>
                                <td>{row.date}</td>
                                <td>$0.00</td>
                                <td>
                                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                                    Failed
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
