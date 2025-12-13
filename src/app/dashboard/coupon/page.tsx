"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import CouponTab from "@/components/coupon/CouponTab";
import ReferralTab from "@/components/coupon/ReferralTab";
import PlansTab from "@/components/coupon/PlansTab";

export default function CouponPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("coupon");

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
          title="Coupon Management"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Manage Coupons, Referrals & Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="coupon">Coupon</TabsTrigger>
                  <TabsTrigger value="referral">Referral</TabsTrigger>
                  <TabsTrigger value="plans">Plans</TabsTrigger>
                </TabsList>
                
                <TabsContent value="coupon">
                  <CouponTab />
                </TabsContent>
                
                <TabsContent value="referral">
                  <ReferralTab />
                </TabsContent>
                
                <TabsContent value="plans">
                  <PlansTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
