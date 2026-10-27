"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuoteStatusDropdown({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsUpdating(true);

    try {
      await fetch(`/api/admin/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh(); // Table ko update karne ke liye refresh
    } catch (error) {
      console.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: any = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONTACTED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
  };

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={isUpdating}
      className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer ${statusColors[currentStatus] || "bg-gray-100 text-gray-800"}`}
    >
      <option value="PENDING">PENDING</option>
      <option value="CONTACTED">CONTACTED</option>
      <option value="COMPLETED">COMPLETED</option>
    </select>
  );
}