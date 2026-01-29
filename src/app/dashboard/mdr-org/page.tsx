// dashboard/mdr-org/page.tsx
"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import { mdrPanelUser } from "../../../../prisma/generated/panel";
import { 
    Edit, 
    Trash2, 
    EyeIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    LucideUserPlus2,
    Search,
    LoaderCircle,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";


// ui components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"

// main component
export default function MDROrgPage() {
  // sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // load users
  const [users, setUsers] = useState<mdrPanelUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  // delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // table controls
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "employee">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  // view dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);
  // active admins (dashboard list)
  const [activeAdmins, setActiveAdmins] = useState<mdrPanelUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const [adminLimit, setAdminLimit] = useState(5);
  const [adminTotalPages, setAdminsTotalPages] = useState(1);
  
  // form state
  const initialUserForm = {
    first_name: "",
    last_name: "",
    email: "",
    role: "employee",
    phone1: "",
    mdr_id: "",
    isactive: true,
  };
  const [userFormData, setUserFormData] = useState(initialUserForm);
 

  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  useEffect(() => {
    setIsSearching(true);

    const timeout = setTimeout(() => {
        setDebouncedSearch(searchText);
        setPage(1); // reset page only after debounce
        setIsSearching(false);
    }, 400); 

    return () => clearTimeout(timeout);
  }, [searchText]);


/**
* Fetch users on initial page load
* */
  const fetchUsers = async () => {
    if (!debouncedSearch) {
        setLoading(true);
    }

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        role: roleFilter,
        sort: sortDir,
    });

    if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
    }

    const res = await fetch(`/api/mdr-org?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();

    setUsers(Array.isArray(json.data) ? json.data : []);
    setTotalUsers(json.pagination?.total ?? 0);
    setTotalPages(json.pagination?.totalPages ?? 1);

    setLoading(false);
  };
useEffect(() => {
  fetchUsers();
}, [page, limit, debouncedSearch, statusFilter, roleFilter,sortDir]);


// HANDLE NEW USER  
const handleSubmit = async () => {
  try {
    setSubmitting(true);

    const payload = editMode
      ? {
          // EDIT payload
          id: editUserId,
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          role: userFormData.role.toLowerCase(),
          phone1: userFormData.phone1,
          isactive: userFormData.isactive,
        }
      : {
          // CREATE payload
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          email: userFormData.email,
          role: userFormData.role.toLowerCase(),
          phone1: userFormData.phone1,
          mdr_id: userFormData.mdr_id,
          isactive: userFormData.isactive,
        };

    const response = await fetch("/api/mdr-org", {
      method: editMode ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        setFormError(data.error || "Failed to save user");
        toast.error(data.error || "Failed to save user");
        return;
    }

    // success
    toast.success(editMode ? "User updated successfully" : "User created successfully");
    setEditDialogOpen(false);
    setEditMode(false);
    setEditUserId(null);
    setUserFormData(initialUserForm);

    await Promise.all([
        fetchUsers(),
    ]);

  } catch (err) {
    console.error("Error saving user:", err);
  } finally {
    setSubmitting(false);
  }
};


// HANDLE EDIT USER
const handleEdit = (user: mdrPanelUser) => {
  //open dialog in edit mode
  setEditMode(true);
  //store who is being edited
  setEditUserId(user.id);
  //prefill form with existing data
  setUserFormData({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    role: user.role ?? "employee",
    phone1: user.phone1 ?? "",
    mdr_id: user.mdr_id ?? "",
    isactive: user.isactive,
  });
  setFormError(null);
  setEditDialogOpen(true);
};


// HANDLE DELETE USER
const handleDelete = async () => {
if (!deleteUserId) return;

try {
setIsDeleting(true);

await fetch("/api/mdr-org", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: deleteUserId }),
});

// remove from UI
setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));

setDeleteDialogOpen(false);
setDeleteUserId(null);

} catch (err) {
    console.error("Failed to delete user", err);
} finally {
    setIsDeleting(false);
}};


// HANDLE VIEW USER
const handleView = async (user: mdrPanelUser) => {
    setViewDialogOpen(true);
    setViewLoading(true);

try {
    const res = await fetch(`/api/mdr-org?id=${user.id}`, {
    cache: "no-store",
});
// get full user details
const json = await res.json();
setViewUser(json.data ?? null);
} catch (err) {
    console.error("View user failed", err);
    setViewUser(null);
} finally {
    setViewLoading(false);
}};

// HANDLE TOGGLE STATUS
const handleToggleStatus = async (user: mdrPanelUser) => {
  try {
    const newStatus = !user.isactive;

    const res = await fetch("/api/mdr-org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        isactive: newStatus,
      }),
    });

    if (!res.ok) throw new Error("Failed to update status");

    // update UI instantly
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isactive: newStatus } : u
      )
    );

  } catch (err) {
    console.error("Error toggling status:", err);
  }
};





// render all ui
return (
  <>
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

    {/* MAIN COLUMN */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        <Header
          title="MDR User Panel"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

    {/* FILTERS / SEARCH */}
    <div className="mx-5 translate-y-1/4 max-w-[1400px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Search */}
            <div className="relative w-full sm:w-80">
                {isSearching ? (
                      <LoaderCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                <Input
                className="pl-10"
                placeholder= "Search users..."
                value={searchText}
                onChange={(e) => {
                    setPage(1);
                    setSearchText(e.target.value);
                }}
                />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
            {/* New User Buton */}
            <Button
                onClick={() => {
                    setEditMode(false);
                    setEditUserId(null);
                    setFormError(null);
                    setUserFormData(initialUserForm);
                    setEditDialogOpen(true);
                }}
            >
                New User
                <LucideUserPlus2 className="ml-1 h-5 w-5" />
            </Button>

            {/* Role Filter */}
            <select
                className="border rounded-md px-3 py-2"
                value={roleFilter}
                onChange={(e) => {
                    setPage(1);
                    setRoleFilter(e.target.value as "all" | "admin" | "employee");
                }}
            >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
            </select>

            {/* Status Filter */}
            <select
                className="border rounded-md px-3 py-2"
                value={statusFilter}
                onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value as "active" | "inactive" | "all");
                }}
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All Status</option>
            </select>

            {/* Sort toggle */}
            <button
                className="border rounded-md px-3 py-2 hover:bg-gray-100"
                onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                title="Sort by First Name"
            >
                Sort: {sortDir === "asc" ? "A->Z" : "Z->A"}
            </button>

            </div>
        </div>
    </div>


{/* CONTENT */}
<main className="p-6 text-sm text-muted-foreground">
    {loading ? (
        <div>Loading users...</div>
        ) : (
        <>
        {isSearching && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
                Searching...
            </div>
        )}
    <Card className="mt-4">
        <CardContent className="p-0">
              {/* TABLE */}
            <Table>
                <TableHeader className="bg-muted 40">
                    <TableRow className="border-b last:border-b-0">
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center pr-6">
                            Actions
                            </TableHead>

                    </TableRow>
                </TableHeader>

                {/* TABLE BODY */}
                <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="border-b hover:bg-gray-50 transition">
                        <TableCell>{u.first_name}</TableCell>
                        <TableCell>{u.last_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>{u.phone1 || "-"}</TableCell>
                        
                        <TableCell>
                            <span
                              className={clsx(
                                "px-2 py-1 rounded square-full text-xs font-medium",
                                u.isactive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-grey-800"
                               )}
                               >
                                {u.isactive ? "Active" : "Inactive"}
                            </span>
                        </TableCell>

                    {/* ACTIONS */}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-center gap-3">
                            {/* View */}
                            <button
                                type="button"
                                className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-black-100 text-grey-600"
                                onClick={() => handleView(u)}
                                title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          
                            {/* Edit */}
                            <button
                                type="button"
                                className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-blue-100 text-blue-600"
                                onClick={() => handleEdit(u)}
                                title="Edit"
                            >
                                <Edit className="h-5 w-5" />
                            </button>

                            {/* Delete */}
                            <button
                                type="button"
                                className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-red-100 text-red-600"
                                onClick={() => {
                                    setDeleteUserId(u.id);
                                    setDeleteDialogOpen(true);
                                }}
                                title="Delete"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
            </Table>

        <div className="flex items-center justify-between border-t px-4 py-3">
            {/* Count */}
            <span className="text-sm text-muted-foreground">
                Showing {users.length} of {totalUsers} users
            </span>

            {/* PAGINATION */}
            <div className="flex items-center justify-end items-center gap-4 border-t px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Rows per page */}
                    <span>Rows per page</span>
                    
                    <Select
                        value={String(limit)}
                        onValueChange={(value) => {
                            setPage(1);
                            setLimit(Number(value));
                        }}
                    >
                        <SelectTrigger className="w-[80px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 15, 20].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page Info */}
                <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>
                
                {/* Nav Buttons */}
                <div className="flex items-center gap-1">
                    {/* First Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                    >
                        <ChevronsLeft className="h-5 w-5" />
                    </Button>

                    {/* Prev Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Button>
                    
                    {/* Next Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ArrowRightIcon className="h-5 w-5" />
                    </Button>
                    {/* Last Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                    >
                        <ChevronsRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
            </div>
        </CardContent> 
    </Card>
</>
)}
</main>
</div>
</div>

    {/* DELETE DIALOG */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user?
          </DialogDescription>
        </DialogHeader>
        
        {/* DELETE CONFIRMATION */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* EDIT DIALOG */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {editMode ? "Edit User" : "Create User"}
      </DialogTitle>
      <DialogDescription>
        {editMode  
          ? "Update user details below." 
          : "Enter details to create a new user."}
      </DialogDescription>
    </DialogHeader>

    {formError && (
      <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium animate-in fade-in zoom-in duration-200">
        {formError}
      </div>
    )}

    <div className="space-y-4">

      {/* First Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={userFormData.first_name}
          onChange={(e) =>
            setUserFormData({ ...userFormData, first_name: e.target.value })
          }
        />
      </div>

      {/* Last Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Last Name</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={userFormData.last_name}
          onChange={(e) =>
            setUserFormData({ ...userFormData, last_name: e.target.value })
          }
        />
      </div>

      {/* Role */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={userFormData.role}
          onChange={(e) =>
            setUserFormData({ ...userFormData, role: e.target.value })
          }
        >
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
        </select>
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Phone</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={userFormData.phone1}
          onChange={(e) =>
            setUserFormData({ ...userFormData, phone1: e.target.value })
          }
        />
      </div>
       
       {/* Activity Status */}
       <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
            Status
        </label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={userFormData.isactive ? "active" : "inactive"}
          onChange={(e) =>
            setUserFormData({ 
              ...userFormData, 
              isactive: e.target.value === "active" 
            })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

       {/* Features for creating new users */}
       
       {/* Email */}
       {!editMode && (
        <>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={userFormData.email}
            onChange={(e) =>
              setUserFormData({ ...userFormData, email: e.target.value })
            }
          />
        </div>

        {/* MDR ID */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">MDR ID</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={userFormData.mdr_id}
            onChange={(e) =>
              setUserFormData({ ...userFormData, mdr_id: e.target.value })
            }
          />
        </div>
        </>
       )}
    </div>

        <DialogFooter>
         <Button
            variant="outline"
            onClick={() => setEditDialogOpen(false)}
            disabled={submitting}
        >
            Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
                </Button>
            </DialogFooter>
    </DialogContent>
  </Dialog>

    {/* VIEW DIALOG */}
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View user information below.
          </DialogDescription>
        </DialogHeader>

        {/* View User Details */}
        {viewLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
        ) : viewUser ? (
            <div className="space-y-3 text-sm">
                <div><strong>First Name:</strong> {viewUser.first_name}</div>
                <div><strong>Last Name:</strong> {viewUser.last_name}</div>
                <div><strong>Email:</strong> {viewUser.email}</div>
                <div><strong>Role:</strong> {viewUser.role}</div>
                <div><strong>Phone 1:</strong> {viewUser.phone1 || "-"}</div>
                <div><strong>Phone 2:</strong> {viewUser.phone2 || "-"}</div>
                <div>
                    <strong>Status:</strong>{" "}
                    {viewUser.isactive ? "Active" : "Inactive"}
                </div>
                <div>
                    <strong>MDR ID:</strong>{" "} 
                    {viewUser.mdr_id ?? "—"}
                </div>
                <div> 
                    <strong>Date of Joining:</strong>{" "}
                    {viewUser.date_of_joining ? new Date(viewUser.date_of_joining).toLocaleDateString() : "—"}  
                </div>
                <div>
                    <strong>Last Updated:</strong>{" "}
                    {viewUser.updated_at ? new Date(viewUser.updated_at).toLocaleDateString() : "—"}    
                </div>
            </div>
        ) : (
            <div className="text-sm text-gray-600">No user data available.</div>
        )}
        <DialogFooter>
            <Button variant= "outline" onClick={() => setViewDialogOpen(false)}>
                Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
 );
}
/////////////// ///////////////
