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
} from "lucide-react";
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
};

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
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
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=1&limit=50000`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const normalized = (data.users || []).map(normalizeUser);
      setAllUsers(normalized);
      setFilteredUsers(normalized);
      setTotalUsers(normalized.length);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtering & Sorting
  useEffect(() => {
    let filtered = [...allUsers];

    if (regionFilter !== "total") {
      filtered = filtered.filter((u) => u.region === regionFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => getStatus(u) === statusFilter);
    }

    // Text search
    if (filterText.trim()) {
      const term = filterText.toLowerCase();
      filtered = filtered.filter((u) => {
        const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone_num || "").toLowerCase();
        const id = String(u.id);
        const mdr = String(u.mdr_id ?? "");
        return (
          name.includes(term) ||
          email.includes(term) ||
          phone.includes(term) ||
          id.includes(term) ||
          mdr.includes(term)
        );
      });
    }

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
          case "status":
            aVal = getStatus(a);
            bVal = getStatus(b);
            break;
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredUsers(filtered);
    setTotalUsers(filtered.length);
    setCurrentPage(1);
  }, [allUsers, filterText, sortConfig, regionFilter, statusFilter]); // always 5 items

  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? prev.direction === "asc"
          ? null
          : { key, direction: "asc" }
        : { key, direction: "asc" }
    );
  };

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  const handleResetPassword = (user: User) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${baseUrl}/reset-password?token=${user.id}-${Date.now()}&id=${
      user.id
    }`;
    setResetLink(link);
    setUserToReset(user);
    setResetPasswordDialogOpen(true);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(resetLink);
    toast.success("Reset link copied!");
  };

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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="pl-10"
                      disabled={loading}
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
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("status")}
                            className="font-medium"
                          >
                            Status <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
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
                              <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            </TableCell>
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
                          const status = getStatus(user);
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
                              <TableCell>
                                <span
                                  className={clsx(
                                    "px-2.5 py-1 rounded-full text-xs font-medium",
                                    status === "Active" &&
                                      "bg-green-100 text-green-800",
                                    status === "Inactive" &&
                                      "bg-red-100 text-red-800",
                                    status === "Expired" &&
                                      "bg-gray-100 text-gray-800"
                                  )}
                                >
                                  {status}
                                </span>
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
                                      onClick={() => handleResetPassword(user)}
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />{" "}
                                      Reset Password
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reset Password Link</DialogTitle>
              <DialogDescription>
                Send this secure reset link to the user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Input
                  value={resetLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={handleCopyLink} size="sm">
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              {userToReset && (
                <p className="text-sm text-muted-foreground">
                  For:{" "}
                  <strong>
                    {userToReset.first_name} {userToReset.last_name}
                  </strong>{" "}
                  ({userToReset.email || userToReset.phone_num})
                </p>
              )}
            </div>
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
                onClick={() => {
                  setAllUsers((prev) =>
                    prev.filter((u) => u.id !== userToDelete?.id)
                  );
                  setFilteredUsers((prev) =>
                    prev.filter((u) => u.id !== userToDelete?.id)
                  );
                  toast.success("User deleted");
                  setDeleteDialogOpen(false);
                }}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
