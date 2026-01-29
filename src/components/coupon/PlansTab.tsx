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

interface Plan {
  plan_id: string;
  amount: number;
  validity: string | null;
  validity_in_days: number;
  visibility: boolean;
  description_line1: string | null;
  description_line2: string | null;
  SmartVitals: boolean;
  Medication: boolean;
  Vaccines: boolean;
  HealthSnapShot: boolean;
  Records: boolean;
  Prenatal: boolean;
  HealthHub: boolean;
  Members: boolean;
  ABHA: boolean;
}

interface PlanFormData {
  plan_id: string;
  amount: string;
  validity: string;
  validity_in_days: string;
  visibility: boolean;
  description_line1: string;
  description_line2: string;
  SmartVitals: boolean;
  Medication: boolean;
  Vaccines: boolean;
  HealthSnapShot: boolean;
  Records: boolean;
  Prenatal: boolean;
  HealthHub: boolean;
  Members: boolean;
  ABHA: boolean;
}

const initialFormData: PlanFormData = {
  plan_id: "",
  amount: "",
  validity: "",
  validity_in_days: "",
  visibility: true,
  description_line1: "",
  description_line2: "",
  SmartVitals: true,
  Medication: true,
  Vaccines: true,
  HealthSnapShot: true,
  Records: true,
  Prenatal: true,
  HealthHub: true,
  Members: true,
  ABHA: true,
};

export function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [region, setRegion] = useState("india");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [page, region]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/plans?page=${page}&limit=10&region=${region}`
      );
      const data = await response.json();

      if (data.success) {
        setPlans(data.data);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || "Failed to fetch plans");
        toast.error(data.error || "Failed to fetch plans");
      }
    } catch (err) {
      setError("Failed to fetch plans");
      console.error(err);
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editMode ? `/api/plans/${formData.plan_id}` : "/api/plans";
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          region,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || `Plan ${editMode ? "updated" : "created"} successfully`);
        setCreateDialogOpen(false);
        setFormData(initialFormData);
        setEditMode(false);
        fetchPlans();
      } else {
        toast.error(data.error || `Failed to ${editMode ? "update" : "create"} plan`);
      }
    } catch (error) {
      console.error(`Error ${editMode ? "updating" : "creating"} plan:`, error);
      toast.error(`Failed to ${editMode ? "update" : "create"} plan`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditMode(true);
    setFormData({
      plan_id: plan.plan_id,
      amount: plan.amount.toString(),
      validity: plan.validity || "",
      validity_in_days: plan.validity_in_days.toString(),
      visibility: plan.visibility,
      description_line1: plan.description_line1 || "",
      description_line2: plan.description_line2 || "",
      SmartVitals: plan.SmartVitals,
      Medication: plan.Medication,
      Vaccines: plan.Vaccines,
      HealthSnapShot: plan.HealthSnapShot,
      Records: plan.Records,
      Prenatal: plan.Prenatal,
      HealthHub: plan.HealthHub,
      Members: plan.Members,
      ABHA: plan.ABHA,
    });
    setCreateDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/plans/${deleteId}?region=${region}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Plan deleted successfully");
        fetchPlans();
        setDeleteDialogOpen(false);
        setDeleteId(null);
      } else {
        toast.error(data.error || "Failed to delete plan");
      }
    } catch (err) {
      toast.error("Failed to delete plan");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading plans...</div>
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
        <h2 className="text-2xl font-bold text-gray-900">Plans Management</h2>
        <div className="flex gap-4">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="india">India</option>
            <option value="usa">USA</option>
          </select>
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setEditMode(false);
              setFormData(initialFormData);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditMode(false);
                setFormData(initialFormData);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                <DialogDescription>
                  {editMode ? "Update existing plan details." : "Add a new subscription plan to the system."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_id">Plan ID <span className="text-red-500">*</span></Label>
                    <Input
                      id="plan_id"
                      value={formData.plan_id}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_id: e.target.value })
                      }
                      required
                      disabled={editMode} // ID cannot be changed during edit
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validity">Validity (Text)</Label>
                    <Input
                      id="validity"
                      value={formData.validity}
                      onChange={(e) =>
                        setFormData({ ...formData, validity: e.target.value })
                      }
                      placeholder="e.g. 1 Year"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validity_in_days">Validity (Days) <span className="text-red-500">*</span></Label>
                    <Input
                      id="validity_in_days"
                      type="number"
                      min="0"
                      value={formData.validity_in_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validity_in_days: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description_line1">Description Line 1</Label>
                    <Input
                      id="description_line1"
                      value={formData.description_line1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_line1: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description_line2">Description Line 2</Label>
                    <Input
                      id="description_line2"
                      value={formData.description_line2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_line2: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Features & Visibility</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="visibility"
                        checked={formData.visibility}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            visibility: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="visibility" className="cursor-pointer">
                        Visible
                      </Label>
                    </div>
                    {Object.keys(initialFormData)
                      .filter(
                        (key) =>
                          ![
                            "plan_id",
                            "amount",
                            "validity",
                            "validity_in_days",
                            "visibility",
                            "description_line1",
                            "description_line2",
                          ].includes(key)
                      )
                      .map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <Checkbox
                            id={feature}
                            checked={
                              formData[feature as keyof PlanFormData] as boolean
                            }
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                [feature]: checked as boolean,
                              })
                            }
                          />
                          <Label htmlFor={feature} className="cursor-pointer">
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
                    onClick={() => setCreateDialogOpen(false)}
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
                      editMode ? "Update Plan" : "Create Plan"
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
                  Plan ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity (Days)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.plan_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {plan.plan_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {region === "india" ? "₹" : "$"}{plan.amount.toString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.validity_in_days} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        plan.visibility
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {plan.visibility ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {plan.SmartVitals && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          SmartVitals
                        </span>
                      )}
                      {plan.Medication && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          Medication
                        </span>
                      )}
                      {plan.HealthHub && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          HealthHub
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(plan.plan_id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
              Are you sure you want to delete this plan? This action cannot be undone.
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

export default PlansTab;
