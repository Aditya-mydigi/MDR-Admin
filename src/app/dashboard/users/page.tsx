// app/users/page.tsx (or wherever your UsersPage is)
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreVertical,
  ArrowUpDown,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Trash2,
  Copy,
  Search,
  Loader2,
  PlusCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";

type RawUser = { [k: string]: any };
type User = {
  id: string | number;
  mdr_id?: string | number | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_num?: string | null;
  expiry_date?: string | null;
  created_at?: string | null;
  region?: string;
  user_plan_active: boolean;
  plan_id?: string | null;
};

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [resetLink, setResetLink] = useState("");
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive" | "Expired"
  >("all");
  const [regionFilter, setRegionFilter] = useState<"total" | "india" | "usa">(
    "total"
  );
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Subscription Dialog States
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [userForSub, setUserForSub] = useState<User | null>(null);
  const [plans, setPlans] = useState<{ india: any[]; usa: any[] }>({ india: [], usa: [] });
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customExpiry, setCustomExpiry] = useState("");
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);

  // Sidebar persistence
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const getStatus = (user: User): "Active" | "Inactive" | "Expired" => {
    if (!user.user_plan_active) return "Inactive";
    if (user.expiry_date && new Date(user.expiry_date) < new Date())
      return "Expired";
    return "Active";
  };

  const normalizeUser = (u: RawUser): User => ({
    id: u.id ?? u.ID ?? u._id ?? String(Math.random()),
    mdr_id: u.mdr_id ?? u.mdrId ?? null,
    first_name: u.first_name ?? u.firstName ?? "",
    last_name: u.last_name ?? u.lastName ?? "",
    email: u.email ?? null,
    phone_num: u.phone_num ?? u.phone ?? null,
    expiry_date: u.expiry_date ?? u.expiryDate ?? null,
    created_at: u.created_at ?? u.createdAt ?? null,
    region: (u.region ?? "").toLowerCase(),
    user_plan_active: !!u.user_plan_active,
    plan_id: u.plan_id ?? u.planId ?? null,
  });

  const fetchUsers = async (isSearch = false) => {
    if (isSearch) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (filterText.trim()) {
        params.append("search", filterText.trim());
      }
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (regionFilter !== "total") {
        params.append("region", regionFilter);
      }

      const res = await fetch(`/api/users?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      const normalized = (data.users || []).map(normalizeUser);
      
      setUsers(normalized);
      setTotalUsers(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search changes
      fetchUsers(true); // Pass true to indicate this is a search operation
    }, 500);

    return () => clearTimeout(timer);
  }, [filterText]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    // We don't call fetchUsers here because the next effect will catch the state change
    // providing we include statusFilter and regionFilter in its dependency array
    // BUT to avoid double firing or missing firing if page is already 1, 
    // we can simplifiy by adding them to the dependency array of the main fetch effect.
  }, [statusFilter, regionFilter]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, statusFilter, regionFilter]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        if (data.success) {
          setPlans(data.plans);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };
    fetchPlans();
  }, []);

  // Client-side filtering for region and status REMOVED (now handled by API)
  // We kept sorting here if needed, or strictly rely on API order.
  // The API returns mixed results from 2 DBs, so client-side sorting of the *page* is still useful.
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Client-side sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal: any = "";
        let bVal: any = "";
        switch (sortConfig.key) {
          case "mdr_id":
            aVal = a.mdr_id ?? "";
            bVal = b.mdr_id ?? "";
            break;
          case "username":
            aVal = `${a.first_name ?? ""} ${a.last_name ?? ""}`;
            bVal = `${b.first_name ?? ""} ${b.last_name ?? ""}`;
            break;
          case "email":
            aVal = a.email ?? "";
            bVal = b.email ?? "";
            break;

        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? prev.direction === "asc"
          ? null
          : { key, direction: "asc" }
        : { key, direction: "asc" }
    );
  };

  const paginatedUsers = filteredUsers;

  const isAllSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedRows.includes(String(u.id)));
  const isIndeterminate =
    !isAllSelected &&
    paginatedUsers.some((u) => selectedRows.includes(String(u.id)));

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedUsers.map((u) => String(u.id)) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleResetPassword = async (user: User) => {
    setUserToReset(user);
    setResetPasswordDialogOpen(true);

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          region: user.region,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success("Password reset & email sent successfully!");
      setResetLink("");
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
      setResetPasswordDialogOpen(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(resetLink);
    toast.success("Reset link copied!");
  };

  const handleToggleSubscription = async (user: User, active: boolean) => {
    try {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, user_plan_active: active } : u
        )
      );

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: user.region,
          active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      toast.success(data.message || "Subscription updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, user_plan_active: !active } : u
        )
      );
    }
  };

  const handleAddSubscription = async () => {
    if (!userForSub || !selectedPlanId) return;

    setIsUpdatingSub(true);
    try {
      const res = await fetch(`/api/users/${userForSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: userForSub.region,
          active: true,
          plan_id: selectedPlanId,
          expiry_date: customExpiry || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      toast.success("Subscription added successfully");
      setSubDialogOpen(false);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setIsUpdatingSub(false);
    }
  };

  return (
    <div
      className={clsx(
        "h-screen bg-background flex overflow-hidden",
        sidebarOpen && "overflow-hidden"
      )}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col bg-background">
        <Header
          title="User Management"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
                  <div className="relative w-full sm:w-80">
                    {isSearching ? (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      placeholder="Search users..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="pl-10"
                      disabled={loading && !isSearching}
                    />
                  </div>

                  {/* Status Filter */}
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(
                        value as "all" | "Active" | "Inactive" | "Expired"
                      )
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Region Buttons */}
                  <div className="flex gap-2">
                    {(["total", "india", "usa"] as const).map((region) => (
                      <Button
                        key={region}
                        variant={
                          regionFilter === region ? "default" : "outline"
                        }
                        onClick={() => setRegionFilter(region)}
                        disabled={loading}
                      >
                        {region.charAt(0).toUpperCase() + region.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("mdr_id")}
                            className="font-medium"
                          >
                            MDR ID <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("username")}
                            className="font-medium"
                          >
                            Username <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("email")}
                            className="font-medium"
                          >
                            Email/Phone <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>

                        <TableHead className="text-center">
                          Subscriptions
                        </TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        // Beautiful Skeleton Rows
                        [...Array(10)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="h-4 w-56 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col items-center space-y-1">
                                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-12 bg-muted/60 rounded animate-pulse" />
                              </div>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        ))
                      ) : paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-16 text-muted-foreground"
                          >
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user) => {
                          const isSelected = selectedRows.includes(
                            String(user.id)
                          );

                          return (
                            <TableRow
                              key={user.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(
                                      String(user.id),
                                      checked as boolean
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {user.mdr_id ?? user.id}
                              </TableCell>
                              <TableCell>
                                {user.first_name} {user.last_name}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{user.email || "—"}</div>
                                  {user.phone_num && (
                                    <div className="text-muted-foreground text-xs">
                                      {user.phone_num}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-sm">
                                    {user.plan_id 
                                      ? user.plan_id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                      : "Free Tier"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {(() => {
                                      if (!user.user_plan_active) return "Inactive";
                                      if (!user.expiry_date) return "Lifetime";
                                      const expiry = new Date(user.expiry_date);
                                      const now = new Date();
                                      if (expiry < now) return "Expired";
                                      
                                      const diffTime = expiry.getTime() - now.getTime();
                                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                      const months = Math.floor(diffDays / 30);
                                      
                                      if (months === 0) return `${diffDays} days left`;
                                      return `${months} ${months === 1 ? 'month' : 'months'} left`;
                                    })()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-background border shadow-lg"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setUserToReset(user);
                                        setResetPasswordDialogOpen(true);
                                      }}
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setUserForSub(user);
                                        setSelectedPlanId(user.plan_id || "");
                                        // Set default expiry to current one if exists or empty
                                        if (user.expiry_date) {
                                          setCustomExpiry(new Date(user.expiry_date).toISOString().split('T')[0]);
                                        } else {
                                          setCustomExpiry("");
                                        }
                                        setSubDialogOpen(true);
                                      }}
                                    >
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      Add Subscription
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {!loading && totalUsers > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      {selectedRows.length} of {totalUsers.toLocaleString()}{" "}
                      selected
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(v) => {
                          setPageSize(+v);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Rows per page" />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50, 100].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              Rows per page {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Reset Password Dialog */}
        <Dialog
          open={resetPasswordDialogOpen}
          onOpenChange={setResetPasswordDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Password Reset</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset this user's password? The new
                password will be emailed to them.
              </DialogDescription>
            </DialogHeader>

            {userToReset && (
              <p className="py-4 text-sm text-muted-foreground">
                User:{" "}
                <strong>
                  {userToReset.first_name} {userToReset.last_name}
                </strong>{" "}
                ({userToReset.email})
              </p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!userToReset) return;

                  try {
                    const res = await fetch("/api/users/reset-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: userToReset.email,
                        region: userToReset.region,
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed");

                    toast.success("Password reset & email sent successfully!");
                    setResetPasswordDialogOpen(false);
                  } catch (err: any) {
                    toast.error(err.message || "Reset failed");
                  }
                }}
              >
                Confirm Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All data for this user will be
                permanently removed.
              </DialogDescription>
            </DialogHeader>
            {userToDelete && (
              <div className="py-4 space-y-2 text-sm">
                <p>
                  <strong>Name:</strong> {userToDelete.first_name}{" "}
                  {userToDelete.last_name}
                </p>
                <p>
                  <strong>Email:</strong> {userToDelete.email || "—"}
                </p>
                <p>
                  <strong>ID:</strong> {userToDelete.id}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={async () => {
                  if (!userToDelete) return;

                  setIsDeleting(true);
                  try {
                    const res = await fetch(`/api/users/${userToDelete.id}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        region: userToDelete.region,
                        mdr_id: userToDelete.mdr_id,
                      }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                      throw new Error(data.error || data.message || "Failed to delete user");
                    }

                    toast.success("User deleted successfully");
                    setDeleteDialogOpen(false);
                    fetchUsers(); // Refresh the list
                  } catch (err: any) {
                    console.error("Delete user error:", err);
                    toast.error(err.message || "Delete failed");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Subscription Dialog */}
        <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add/Edit Subscription</DialogTitle>
              <DialogDescription>
                Update the subscription plan and validity for {userForSub?.first_name} {userForSub?.last_name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {(userForSub?.region?.toLowerCase() === "india" ? plans.india : plans.usa).map((plan) => (
                      <SelectItem key={plan.plan_id} value={plan.plan_id}>
                        {plan.plan_id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - {plan.validity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Custom Expiry Date (Optional)</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Leave empty to use the plan's default validity.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubscription} disabled={isUpdatingSub || !selectedPlanId}>
                {isUpdatingSub ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Subscription"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
