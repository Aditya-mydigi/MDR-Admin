"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReferralCode {
  id: number;
  referral_code: string;
  free_trial_days: number;
  SmartVitals: boolean;
  Medication: boolean;
  Vaccines: boolean;
  HealthSnapShot: boolean;
  Records: boolean;
  Prenatal: boolean;
  HealthHub: boolean;
  Members: boolean;
  ABHA: boolean;
  COUNT: number;
  MAX: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  referral_code: string;
  free_trial_days: number;
  SmartVitals: boolean;
  Medication: boolean;
  Vaccines: boolean;
  HealthSnapShot: boolean;
  Records: boolean;
  Prenatal: boolean;
  HealthHub: boolean;
  Members: boolean;
  ABHA: boolean;
  COUNT: number;
  MAX: number;
}

const initialFormData: FormData = {
  referral_code: "",
  free_trial_days: 0,
  SmartVitals: false,
  Medication: false,
  Vaccines: false,
  HealthSnapShot: false,
  Records: false,
  Prenatal: false,
  HealthHub: false,
  Members: false,
  ABHA: false,
  COUNT: 0,
  MAX: 0,
};

export default function ReferralTab() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReferralCodes();
  }, [page]);

  const fetchReferralCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/referral?page=${page}&limit=10`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setReferralCodes(data.data);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.error || "Failed to fetch referral codes");
      }
    } catch (error) {
      console.error("Error fetching referral codes:", error);
      toast.error("Failed to fetch referral codes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editMode ? `/api/referral/${currentId}` : "/api/referral";
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setDialogOpen(false);
        resetForm();
        fetchReferralCodes();
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (code: ReferralCode) => {
    setEditMode(true);
    setCurrentId(code.id);
    setFormData({
      referral_code: code.referral_code,
      free_trial_days: code.free_trial_days,
      SmartVitals: code.SmartVitals,
      Medication: code.Medication,
      Vaccines: code.Vaccines,
      HealthSnapShot: code.HealthSnapShot,
      Records: code.Records,
      Prenatal: code.Prenatal,
      HealthHub: code.HealthHub,
      Members: code.Members,
      ABHA: code.ABHA,
      COUNT: code.COUNT,
      MAX: code.MAX,
    });
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/referral/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        fetchReferralCodes();
        setDeleteDialogOpen(false);
        setDeleteId(null);
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete referral code");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditMode(false);
    setCurrentId(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const features = [
    "SmartVitals",
    "Medication",
    "Vaccines",
    "HealthSnapShot",
    "Records",
    "Prenatal",
    "HealthHub",
    "Members",
    "ABHA",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Referral Codes</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditMode(false)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Referral Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Edit Referral Code" : "Create Referral Code"}
              </DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Update the referral code details"
                  : "Add a new referral code with features"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referral_code">Referral Code <span className="text-red-500">*</span></Label>
                  <Input
                    id="referral_code"
                    value={formData.referral_code}
                    onChange={(e) =>
                      setFormData({ ...formData, referral_code: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free_trial_days">Free Trial Days</Label>
                  <Input
                    id="free_trial_days"
                    type="number"
                    min="0"
                    value={formData.free_trial_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        free_trial_days: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="COUNT">Count</Label>
                  <Input
                    id="COUNT"
                    type="number"
                    min="0"
                    value={formData.COUNT}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        COUNT: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="MAX">Max Usage</Label>
                  <Input
                    id="MAX"
                    type="number"
                    min="0"
                    value={formData.MAX}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        MAX: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-3 gap-3">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData[feature as keyof FormData] as boolean}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            [feature]: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor={feature} className="text-sm cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
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
                  ) : editMode ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Code</TableHead>
                  <TableHead>Trial Days</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Count/Max</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No referral codes found
                    </TableCell>
                  </TableRow>
                ) : (
                  referralCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">
                        {code.referral_code}
                      </TableCell>
                      <TableCell>{code.free_trial_days} days</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {features
                            .filter((f) => code[f as keyof ReferralCode])
                            .map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {f}
                              </span>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.COUNT} / {code.MAX}
                      </TableCell>
                      <TableCell>
                        {new Date(code.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(code)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setDeleteId(code.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this referral code? This action cannot be undone.
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
