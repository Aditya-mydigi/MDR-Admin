"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

interface ReferralCode {
  id: number;
  referral_code: string;
}

interface Coupon {
  id: string;
  coupon_code: string;
  type: string | null;
  amount: number;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  mdr_id: string | null;
  created_at: string;
  updated_at: string;
  referral_code: string | null;
  visible: boolean | null;
}

interface CouponFormData {
  coupon_code: string;
  type: string;
  amount: string;
  start_date: string;
  end_date: string;
  usage_limit: string;
  referral_code: string;
  is_active: boolean;
  visible: boolean;
}

const initialFormData: CouponFormData = {
  coupon_code: "",
  type: "percentage",
  amount: "",
  start_date: "",
  end_date: "",
  usage_limit: "",
  referral_code: "",
  is_active: true,
  visible: false,
};

export default function CouponTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [region, setRegion] = useState("india");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);

  useEffect(() => {
    fetchCoupons();
    fetchReferralCodes();
  }, [page, region]);

  const fetchReferralCodes = async () => {
    try {
      const response = await fetch(`/api/referral?limit=100&region=${region}`);
      const data = await response.json();
      if (data.success) {
        setReferralCodes(data.data);
      } else {
        console.error("Failed to fetch referral codes");
      }
    } catch (error) {
      console.error("Error fetching referral codes:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/coupons?page=${page}&limit=10&region=${region}`
      );
      const data = await response.json();

      if (data.success) {
        setCoupons(data.data);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || "Failed to fetch coupons");
        toast.error(data.error || "Failed to fetch coupons");
      }
    } catch (err) {
      setError("Failed to fetch coupons");
      console.error(err);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate dates
      if (formData.start_date && formData.end_date) {
        if (new Date(formData.start_date) > new Date(formData.end_date)) {
          toast.error("Start date cannot be after end date");
          setSubmitting(false);
          return;
        }
      }

      if (!formData.referral_code) {
        toast.error("Referral code is required");
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
        region,
      };

      const url = editMode ? `/api/coupons/${editId}` : "/api/coupons";
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(editMode ? "Coupon updated successfully" : "Coupon created successfully");
        setCreateDialogOpen(false);
        setFormData(initialFormData);
        setEditMode(false);
        setEditId(null);
        fetchCoupons();
      } else {
        toast.error(data.error || (editMode ? "Failed to update coupon" : "Failed to create coupon"));
      }
    } catch (error) {
      console.error(editMode ? "Error updating coupon:" : "Error creating coupon:", error);
      toast.error(editMode ? "Failed to update coupon" : "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditMode(true);
    setEditId(coupon.id);
    setFormData({
      coupon_code: coupon.coupon_code,
      type: coupon.type === "new" ? "percentage" : "fixed",
      amount: coupon.amount.toString(),
      start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().split("T")[0] : "",
      end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().split("T")[0] : "",
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : "",
      referral_code: coupon.referral_code || "",
      is_active: coupon.is_active,
      visible: coupon.visible || false,
    });
    setCreateDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/coupons/${deleteId}?region=${region}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
        setDeleteDialogOpen(false);
        setDeleteId(null);
      } else {
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (err) {
      toast.error("Failed to delete coupon");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };



  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getCouponType = (type: string | null) => {
    if (!type) return "Unknown";
    if (type === "new") return "Percentage";
    if (type === "regular") return "Fixed";
    return type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading coupons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Coupon Management</h2>
        <div className="flex gap-4">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="india">India</option>
            <option value="usa">USA</option>
          </select>
          <Dialog 
            open={createDialogOpen} 
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) {
                setEditMode(false);
                setEditId(null);
                setFormData(initialFormData);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {editMode ? "Update Coupon" : "Create Coupon"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Update Coupon" : "Create New Coupon"}</DialogTitle>
                <DialogDescription>
                  {editMode ? "Edit the details of the existing coupon." : "Add a new coupon code to the system."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coupon_code">Coupon Code *</Label>
                    <Input
                      id="coupon_code"
                      value={formData.coupon_code}
                      onChange={(e) =>
                        setFormData({ ...formData, coupon_code: e.target.value })
                      }
                      placeholder="e.g. SUMMER2024"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ({region === "india" ? "₹" : "$"})</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder={formData.type === "percentage" ? "10" : "100"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage_limit">Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({ ...formData, usage_limit: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="referral_code">Referral Code *</Label>
                    <select
                      id="referral_code"
                      value={formData.referral_code}
                      onChange={(e) =>
                        setFormData({ ...formData, referral_code: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a referral code</option>
                      {referralCodes.map((code) => (
                        <option key={code.id} value={code.referral_code}>
                          {code.referral_code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          is_active: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Active
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visible"
                      checked={formData.visible}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          visible: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="visible" className="cursor-pointer">
                      Visible to User
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setEditMode(false);
                      setEditId(null);
                      setFormData(initialFormData);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editMode ? "Update Coupon" : "Create Coupon"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {coupon.coupon_code}
                      </span>
                      {coupon.referral_code && (
                        <span className="text-xs text-gray-500">
                          Ref: {coupon.referral_code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getCouponType(coupon.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.type === "new"
                      ? `${coupon.amount}%`
                      : region === "india"
                        ? `₹${coupon.amount}`
                        : `$${coupon.amount}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.used_count}
                    {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{formatDate(coupon.start_date)}</span>
                      <span className="text-xs text-gray-400">
                        to {formatDate(coupon.end_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coupon.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                      {coupon.visible && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Visible
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(coupon.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>


      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
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
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
