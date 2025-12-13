"use client";

import { useState, useEffect } from "react";

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

export function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [region, setRegion] = useState("india");

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
      }
    } catch (err) {
      setError("Failed to fetch plans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm(`Are you sure you want to delete plan ${planId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/plans/${planId}?region=${region}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert("Plan deleted successfully");
        fetchPlans();
      } else {
        alert(data.error || "Failed to delete plan");
      }
    } catch (err) {
      alert("Failed to delete plan");
      console.error(err);
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
                    ${plan.amount.toString()}
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
                    <button
                      onClick={() => handleDelete(plan.plan_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
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
    </div>
  );
}

export default PlansTab;
