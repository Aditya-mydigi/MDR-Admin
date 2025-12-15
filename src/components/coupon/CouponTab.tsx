"use client";

import { useState, useEffect } from "react";

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

export default function CouponTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [region, setRegion] = useState("india");

  useEffect(() => {
    fetchCoupons();
  }, [page, region]);

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
      }
    } catch (err) {
      setError("Failed to fetch coupons");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const response = await fetch(`/api/coupons/${id}?region=${region}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert("Coupon deleted successfully");
        fetchCoupons();
      } else {
        alert(data.error || "Failed to delete coupon");
      }
    } catch (err) {
      alert("Failed to delete coupon");
      console.error(err);
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
                      onClick={() => handleDelete(coupon.id)}
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
