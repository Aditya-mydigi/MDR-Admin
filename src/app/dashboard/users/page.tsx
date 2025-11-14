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
  X,
  Plus,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import Loader from "@/components/loader";

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

  /* ✅ Load sidebar state from localStorage */
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
  }, []);

  /* ✅ Save sidebar state to localStorage */
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  /* ✅ Utility Functions */
  const getStatus = (user: User): "Active" | "Inactive" => {
    if (user.expiry_date) {
      const today = new Date();
      const expiry = new Date(user.expiry_date);
      return expiry >= today ? "Active" : "Inactive";
    }
    return "Active";
  };

  const normalizeUser = (u: RawUser): User => ({
    id: u.id ?? u.ID ?? u._id ?? String(Math.random()),
    mdr_id: u.mdr_id ?? u.mdrId ?? u.mdrid ?? null,
    first_name: u.first_name ?? u.firstName ?? "",
    last_name: u.last_name ?? u.lastName ?? "",
    email: u.email ?? u.emailAddress ?? null,
    phone_num: u.phone_num ?? u.phone ?? null,
    expiry_date: u.expiry_date ?? u.expiryDate ?? null,
    created_at: u.created_at ?? u.createdAt ?? null,
  });

  /* ✅ Fetch All Users (fetch all, frontend will paginate) */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // requesting a large limit so we retrieve all users from backend
      const res = await fetch(`/api/users?page=1&limit=50000`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      const normalized = (data.users || []).map(normalizeUser);
      setAllUsers(normalized);
      setFilteredUsers(normalized);
      setTotalUsers(normalized.length);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ✅ Filter and Sort Logic */
  useEffect(() => {
    let filtered = [...allUsers];

    if (filterText.trim()) {
      const searchText = filterText.toLowerCase();
      filtered = filtered.filter((u) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone_num || "").toLowerCase();
        const id = String(u.id).toLowerCase();
        const mdr = String(u.mdr_id ?? "").toLowerCase();
        const status = getStatus(u).toLowerCase();

        return (
          name.includes(searchText) ||
          email.includes(searchText) ||
          phone.includes(searchText) ||
          id.includes(searchText) ||
          mdr.includes(searchText) ||
          status.includes(searchText)
        );
      });
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "mdr_id":
            aValue = String(a.mdr_id ?? "");
            bValue = String(b.mdr_id ?? "");
            break;
          case "username":
            aValue = `${a.first_name || ""} ${a.last_name || ""}`.trim();
            bValue = `${b.first_name || ""} ${b.last_name || ""}`.trim();
            break;
          case "email":
            aValue = a.email || "";
            bValue = b.email || "";
            break;
          case "status":
            aValue = getStatus(a);
            bValue = getStatus(b);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredUsers(filtered);
    setTotalUsers(filtered.length);
    setCurrentPage(1);
  }, [allUsers, filterText, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        }
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  /* ✅ Pagination */
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  /* ✅ Row Selection */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // selection by internal unique id (keeps original behaviour)
      setSelectedRows(paginatedUsers.map((u) => String(u.id)));
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

  const isAllSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedRows.includes(String(u.id)));
  const isIndeterminate =
    !isAllSelected &&
    paginatedUsers.some((u) => selectedRows.includes(String(u.id)));

  /* ✅ Action Handlers */
  const handleResetPassword = (user: User) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const resetToken = `${user.id}-${Date.now()}`;
    const link = `${baseUrl}/reset-password?token=${resetToken}&id=${user.id}`;
    setResetLink(link);
    setUserToReset(user);
    setResetPasswordDialogOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      toast.success("Reset link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleSendResetLink = async () => {
    if (!userToReset) return;

    try {
      // TODO: Implement actual API call to send reset link
      toast.success(
        `Reset password link sent to ${
          userToReset.email || userToReset.phone_num || "user"
        }`
      );
      setResetPasswordDialogOpen(false);
      setUserToReset(null);
      setResetLink("");
    } catch (error) {
      toast.error("Failed to send reset link");
    }
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordDialogOpen(false);
    setUserToReset(null);
    setResetLink("");
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      // TODO: Implement actual delete API call
      setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setTotalUsers((prev) => prev - 1);

      toast.success(
        `User ${userToDelete.first_name} ${userToDelete.last_name} deleted successfully`
      );
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <div
      className={clsx(
        "min-h-screen bg-gray-50 flex",
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
        {/* Custom Header with Search */}
        <header className="flex justify-between items-center bg-white px-6 py-4 shadow-sm sticky top-0 z-30 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
          </div>
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9"
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <Loader />
          ) : (
            <div className="space-y-4">
              {/* Filter Bar */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      placeholder="Filter tasks..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="flex-1 min-w-[200px] max-w-[300px]"
                    />
                    <Button variant="outline" size="sm" className="h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      Status
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      Email/Phone
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Users Table */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="w-12 px-4">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              className="cursor-pointer"
                            />
                          </TableHead>
                          <TableHead className="px-4 py-3">
                            <button
                              onClick={() => handleSort("mdr_id")}
                              className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                            >
                              MDR ID
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </TableHead>
                          <TableHead className="px-4 py-3">
                            <button
                              onClick={() => handleSort("username")}
                              className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                            >
                              Username
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </TableHead>
                          <TableHead className="px-4 py-3">
                            <button
                              onClick={() => handleSort("email")}
                              className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                            >
                              Email/Phone
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </TableHead>
                          <TableHead className="px-4 py-3">
                            <button
                              onClick={() => handleSort("status")}
                              className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                            >
                              Status
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </TableHead>
                          <TableHead className="w-12 px-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-gray-500"
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
                                className="hover:bg-gray-50 border-b"
                              >
                                <TableCell className="px-4 py-3">
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
                                <TableCell className="px-4 py-3 font-medium text-sm">
                                  {/* Display MDR ID (use fallback to id if mdr_id missing) */}
                                  {user.mdr_id ?? user.id}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-sm">
                                  {user.first_name} {user.last_name}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <div className="text-sm">
                                    <div>{user.email || "—"}</div>
                                    {user.phone_num && (
                                      <div className="text-gray-500 text-xs">
                                        {user.phone_num}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <span
                                    className={clsx(
                                      "px-2 py-1 rounded text-xs font-medium",
                                      status === "Active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    )}
                                  >
                                    {status}
                                  </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                      </button>
                                    </DropdownMenuTrigger>

                                    {/* Custom dropdown styles to match provided screenshot.
                                        Important: only the menu styles are adjusted here; functionality/dialogs unchanged. */}
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-48 bg-white rounded-lg shadow-lg border py-1"
                                    >
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleResetPassword(user)
                                        }
                                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[highlighted]:bg-[#0A0A40] data-[highlighted]:text-white"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset Password
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => handleDeleteClick(user)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-red-600 data-[highlighted]:bg-[#0A0A40] data-[highlighted]:text-white"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>

                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer data-[highlighted]:bg-[#0A0A40] data-[highlighted]:text-white"
                                      >
                                        <X className="h-4 w-4" />
                                        Cancel
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

                  {/* Pagination Footer */}
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <div className="text-sm text-gray-600">
                      {selectedRows.length} of {totalUsers} row(s) selected.
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
                        Page {currentPage} of {totalPages}
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
                          className="h-9 w-9"
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
                          className="h-9 w-9"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reset Password Dialog */}
          <Dialog
            open={resetPasswordDialogOpen}
            onOpenChange={handleResetPasswordCancel}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Reset Password
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 pt-3">
                  Send your reset password link to users email or phone
                </DialogDescription>
              </DialogHeader>
              {userToReset && (
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Send reset link to Email/Phone
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={resetLink}
                        onChange={(e) => setResetLink(e.target.value)}
                        placeholder="https://reset-password.com/mpr"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendResetLink}
                        className="bg-[#0a3a7a] hover:bg-[#09406d] text-white min-w-[80px]"
                      >
                        Sent
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleCopyLink}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy link
                    </button>
                    <div className="text-sm text-gray-500">
                      User: {userToReset.first_name} {userToReset.last_name} (
                      {userToReset.email || userToReset.phone_num})
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteCancel}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Are you absolutely sure?
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 pt-3">
                  Are you sure you want to remove this user, all the records
                  stored related to this ID will be deleted as well.
                </DialogDescription>
              </DialogHeader>
              {userToDelete && (
                <div className="py-4 px-1">
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>
                      <span className="font-semibold">User ID: </span>
                      <span className="text-gray-600">{userToDelete.id}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Name: </span>
                      <span className="text-gray-600">
                        {userToDelete.first_name} {userToDelete.last_name}
                      </span>
                    </div>
                    {userToDelete.email && (
                      <div>
                        <span className="font-semibold">Email: </span>
                        <span className="text-gray-600">
                          {userToDelete.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter className="gap-3 sm:gap-2 sm:justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                >
                  Yes, confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
