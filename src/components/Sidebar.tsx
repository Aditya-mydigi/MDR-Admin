"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useSystem } from "@/context/SystemContext";
import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
  Users,
  Ticket,
  Building2,
  Dog,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  sidebarOpen,
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { system } = useSystem();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Map icons to lucide-react icons
  const iconMap: Record<string, React.ReactNode> = {
    Dashboard: <LayoutGrid className="h-5 w-5" />,
    User: <Users className="h-5 w-5" />,
    Subscriptions: <CreditCard className="h-5 w-5" />,
    Transaction: <CreditCard className="h-5 w-5" />,
    "Health Monitor": <Building2 className="h-5 w-5" />,
    Coupon: <Ticket className="h-5 w-5" />,
    "MDR Org": <Building2 className="h-5 w-5" />,
    "Log Out": <LogOut className="h-5 w-5" />,
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "User", href: "/dashboard/users" },
    { label: "Subscriptions", href: "/dashboard/billing" },
    { label: "Transaction", href: "/dashboard/transaction" },
    { label: "Health Monitor", href: "/dashboard/health-checks" },
    { label: "Coupon", href: "/dashboard/coupon" },
    { label: "MDR Org", href: "/dashboard/mdr-org" },
  ];

  const confirmLogout = () => {
    document.cookie = "session=; Max-Age=0; path=/";
    router.push("/login");
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && onCloseMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen text-white flex flex-col transition-all duration-300 ease-in-out shadow-lg",
          system === "MDR"
            ? "bg-gradient-to-b from-[#00f5ef] via-[#02b8f2] to-[#0a3a7a]"
            : "bg-gradient-to-b from-[#20646d] via-[#509d8f] to-[#a2f09a]",
          collapsed ? "w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header Section with Logo */}
        <div className="relative flex-shrink-0">
          {/* Logo Section */}
          <div
            className={clsx(
              "flex justify-center items-center pt-8 pb-6 transition-all duration-300",
              collapsed ? "px-2" : "px-6"
            )}
          >
            {collapsed ? (
              <div className="w-14 h-14 rounded-full bg-transparent flex items-center justify-center text-white font-bold uppercase border-2 border-white text-base">
                MPR
              </div>
            ) : (
              <div className="text-center">
                <div className="relative flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center text-white font-bold uppercase border-2 border-white text-xl">
                    {system === "MDR" ? "MDR" : "MPR"}
                  </div>
                </div>
                <div className="text-xs font-black text-white/90 tracking-widest uppercase">
                  {system === "MDR" ? "MYDIGIRECORDS" : "MYPETSRECORDS"}
                </div>
              </div>
            )}
          </div>

          {/* Divider Line */}
          {!collapsed && <div className="mx-6 h-px bg-white/20" />}
        </div>

        {/* Collapse Toggle Button - Simple and Prominent (Desktop Only) */}
        {onToggleCollapse && (
          <div className="py-6 hidden lg:flex justify-center border-b border-white/10">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" strokeWidth={3} />
              ) : (
                <ChevronLeft className="h-5 w-5" strokeWidth={3} />
              )}
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <nav
          className={clsx(
            "flex-1 flex flex-col transition-all duration-300 overflow-y-auto overflow-x-hidden",
            collapsed ? "px-2 pt-4" : "px-4 pt-4"
          )}
        >
          <div className="space-y-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={onCloseMobile}
                  className={clsx(
                    "flex items-center gap-4 py-3 rounded-lg text-sm transition-all duration-200 relative group",
                    collapsed ? "justify-center px-3" : "px-5",
                    isActive
                      ? clsx(
                        "bg-white shadow-lg font-bold",
                        system === "MDR" ? "text-[#0a3a7a]" : "text-[#356e67]"
                      )
                      : "text-white/90 hover:bg-white/10 hover:text-white font-medium"
                  )}
                >
                  <span
                    className={clsx(
                      "flex-shrink-0 transition-all duration-200",
                      isActive
                        ? system === "MDR" ? "text-[#0a3a7a]" : "text-[#356e67]"
                        : "text-white"
                    )}
                  >
                    {iconMap[item.label]}
                  </span>

                  {!collapsed && (
                    <span className="whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Section with Log Out */}
        <div className="flex-shrink-0 pb-4">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 px-2">
              <button
                onClick={handleLogoutClick}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="px-4">
              <div className="h-px bg-white/20 mb-3" />
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Log Out
              </h3>
              <p className="text-gray-700 text-lg mb-8">
                Are you sure you want to Logout ?
              </p>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
