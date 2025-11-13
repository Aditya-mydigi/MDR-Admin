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
  Eye,
  Mail,
  Phone,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Loader from "@/components/loader";

type RawUser = { [k: string]: any };
type User = {
  id: string | number;
  mdr_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_num?: string | null;
  gender?: string | null;
  dob?: string | null;
  blood_group?: string | null;
  expiry_date?: any; // keep flexible: string | number | object
  payment_date?: any;
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [resetLink, setResetLink] = useState("");
  const [filterText, setFilterText] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);

  // Sidebar persistence
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) setSidebarCollapsed(savedCollapsed === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const getStatus = (user: User): "Active" | "Inactive" => {
    if (user.expiry_date) {
      const today = new Date();
      const expiry = parseToDate(user.expiry_date);
      if (!expiry) return "Inactive";
      return expiry >= today ? "Active" : "Inactive";
    }
    return "Active";
  };

  const calculateAge = (dob: string | null | undefined): string => {
    if (!dob) return "—";
    const birth = parseToDate(dob);
    if (!birth || isNaN(birth.getTime())) return "—";
    const diff = Date.now() - birth.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970).toString();
  };

  /**
   * Robust parser for expiry/payment dates.
   * Accepts:
   * - ISO strings ("2025-11-12T..."),
   * - numeric milliseconds,
   * - numeric seconds,
   * - Firestore-like { seconds, nanoseconds } objects,
   * - Date objects.
   * Returns Date or null if not parseable.
   */
  const parseToDate = (value: any): Date | null => {
    if (!value && value !== 0) return null;

    // If already Date
    if (value instanceof Date) return value;

    // Firestore timestamp-like
    if (typeof value === "object" && value !== null) {
      if (typeof value.seconds === "number") {
        // seconds -> milliseconds
        return new Date(value.seconds * 1000 + (value.nanoseconds ? Math.floor(value.nanoseconds / 1e6) : 0));
      }
      // try toString
      try {
        const s = String(value);
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d;
      } catch {
        // fallthrough
      }
      return null;
    }

    // If number-like
    if (typeof value === "number") {
      // if looks like seconds (10 digits) convert, else treat as ms
      if (value.toString().length === 10) {
        return new Date(value * 1000);
      }
      return new Date(value);
    }

    // If string
    if (typeof value === "string") {
      // trim
      const s = value.trim();
      // if numeric string
      if (/^\d+$/.test(s)) {
        // if length 10 -> seconds; else ms
        if (s.length === 10) return new Date(Number(s) * 1000);
        return new Date(Number(s));
      }
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
    }

    // cannot parse
    console.warn("parseToDate: unable to parse date value:", value);
    return null;
  };

  /**
   * calculateDaysLeft: robust handling of various expiry formats
   * returns "X days", "Expired", or "—"
   */
  const calculateDaysLeft = (paymentDate: any, expiryDate: any): string => {
    if (!expiryDate && !paymentDate) return "—";

    // Try parse expiry first
    const expiry = parseToDate(expiryDate);
    if (!expiry) {
      // fallback: if paymentDate exists but expiry missing, we can't infer duration -> return "—"
      // log for debugging
      if (paymentDate && !expiryDate) {
        console.warn("calculateDaysLeft: expiry_date missing; payment_date present but cannot infer expiry:", { paymentDate });
      } else {
        console.warn("calculateDaysLeft: expiry_date invalid or missing", { expiryDate });
      }
      return "—";
    }

    const today = new Date();
    // Zero the time portion for day counting (so partial days count as full day by using ceil)
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
    const diff = end - start;
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (isNaN(daysLeft)) {
      console.warn("calculateDaysLeft: computed NaN daysLeft", { expiryDate, expiry });
      return "—";
    }
    return daysLeft >= 0 ? `${daysLeft} days` : "Expired";
  };

  const normalizeUser = (u: RawUser): User => ({
    id: u.id ?? u.ID ?? u._id ?? String(Math.random()),
    mdr_id: u.mdr_id ?? "",
    first_name: u.first_name ?? u.firstName ?? "",
    last_name: u.last_name ?? u.lastName ?? "",
    email: u.email ?? u.emailAddress ?? null,
    phone_num: u.phone_num ?? u.phone ?? null,
    gender: u.gender ?? null,
    dob: u.dob ?? u.date_of_birth ?? null,
    blood_group: u.blood_group ?? null,
    payment_date: u.payment_date ?? null,
    expiry_date: u.expiry_date ?? u.expiryDate ?? null,
    created_at: u.created_at ?? u.createdAt ?? null,
  });

  // Fetch users (full dataset)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=1&limit=25000`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      const normalized = (data.users || []).map(normalizeUser);
      setAllUsers(normalized);
      setFilteredUsers(normalized);
      setTotalUsers(normalized.length || (data.total ?? 0));
    } catch (err) {
      console.error("fetchUsers error:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter + Sort (filterText only per your request to keep original behaviour)
  useEffect(() => {
    let filtered = [...allUsers];
    if (filterText.trim()) {
      const searchText = filterText.toLowerCase();
      filtered = filtered.filter((u) =>
        Object.values(u)
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchText)
      );
    }
    setFilteredUsers(filtered);
    setTotalUsers(filtered.length);
    setCurrentPage(1);
  }, [allUsers, filterText]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  // Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(paginatedUsers.map((u) => String(u.id)));
    else setSelectedRows([]);
  };
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedRows((prev) => [...prev, id]);
    else setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
  };

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedRows.includes(String(u.id)));
  const isIndeterminate = !isAllSelected && paginatedUsers.some((u) => selectedRows.includes(String(u.id)));

  // Delete and view handlers
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setFilteredUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setTotalUsers((prev) => Math.max(0, prev - 1));
    toast.success(`User ${userToDelete.first_name} deleted`);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleResetPassword = (user: User) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const resetToken = `${user.id}-${Date.now()}`;
    const link = `${baseUrl}/reset-password?token=${resetToken}&id=${user.id}`;
    setResetLink(link);
    setUserToReset(user);
    setResetPasswordDialogOpen(true);
  };

  return (
    <div className={clsx("min-h-screen bg-gray-50 flex", sidebarOpen && "overflow-hidden")}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 bg-white">
        <header className="flex justify-between items-center bg-white px-6 py-4 shadow-sm sticky top-0 z-30 border-b">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <Loader />
          ) : (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Filter users..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="flex-1 min-w-[200px] max-w-[300px]"
                  />
                  <Button variant="outline" size="sm" className="h-9">
                    <Plus className="h-4 w-4 mr-2" /> Status
                  </Button>
                  <Button variant="outline" size="sm" className="h-9">
                    <Plus className="h-4 w-4 mr-2" /> Email/Phone
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-bold w-12 px-4">
                          <Checkbox
                            checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="font-bold">Username</TableHead>
                        <TableHead className="font-bold">Contact Info</TableHead>
                        <TableHead className="font-bold">Demographics</TableHead>
                        <TableHead className="font-bold">Blood Group</TableHead>
                        <TableHead className="font-bold">Expire In</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold w-12"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user) => {
                          const status = getStatus(user);
                          return (
                            <TableRow key={user.id} className="hover:bg-gray-50 border-b">
                              <TableCell className="px-4 py-3">
                                <Checkbox
                                  checked={selectedRows.includes(String(user.id))}
                                  onCheckedChange={(checked) => handleSelectRow(String(user.id), !!checked)}
                                />
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <div className="font-medium">{user.first_name} {user.last_name}</div>
                                <div className="text-xs text-gray-500">#{user.mdr_id}</div>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  {user.phone_num && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <Phone className="h-4 w-4 text-gray-500" /> {user.phone_num}
                                    </div>
                                  )}
                                  {user.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <Mail className="h-4 w-4 text-gray-500" /> {user.email}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <div className="text-sm">{calculateAge(user.dob)} yrs</div>
                                <div className="text-xs text-gray-500">{user.gender || "—"}</div>
                              </TableCell>

                              <TableCell className="px-4 py-3">{user.blood_group || "—"}</TableCell>

                              <TableCell className="px-4 py-3">{calculateDaysLeft(user.payment_date, user.expiry_date)}</TableCell>

                              <TableCell className="px-4 py-3">
                                <span
                                  className={clsx(
                                    "px-2 py-1 rounded text-xs font-medium",
                                    status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  )}
                                >
                                  {status}
                                </span>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                      <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => { setUserToView(user); setViewDialogOpen(true); }}>
                                      <Eye className="h-4 w-4 mr-2" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                      <RotateCcw className="h-4 w-4 mr-2" /> Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[150px] h-9 text-sm">
                        <SelectValue placeholder={`${pageSize} rows per page`} />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100, 200, 500].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} rows per page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-2 text-sm">Page {currentPage} of {totalPages}</span>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
              </DialogHeader>
              {userToView && (
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {userToView.first_name} {userToView.last_name}</p>
                  <p><strong>MDR ID:</strong> {userToView.mdr_id}</p>
                  <p><strong>Email:</strong> {userToView.email}</p>
                  <p><strong>Phone:</strong> {userToView.phone_num}</p>
                  <p><strong>Gender:</strong> {userToView.gender}</p>
                  <p><strong>Age:</strong> {calculateAge(userToView.dob)}</p>
                  <p><strong>Blood Group:</strong> {userToView.blood_group}</p>
                  <p><strong>Expiry In:</strong> {calculateDaysLeft(userToView.payment_date, userToView.expiry_date)}</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>Do you want to delete this user?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>No</Button>
                <Button onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">Yes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
