"use client";

import { useState } from "react";
import { toggleMarketplaceVisibility } from "@/actions/marketplace";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function VisibilityToggle({ isVisible }: { isVisible: boolean }) {
  const [visible, setVisible] = useState(isVisible);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const result = await toggleMarketplaceVisibility("worker");
      if ("isVisible" in result && result.isVisible !== undefined) {
        setVisible(result.isVisible);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
        visible
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      {visible ? (
        <>
          <Eye size={14} />
          Visible on Marketplace
        </>
      ) : (
        <>
          <EyeOff size={14} />
          Hidden from Marketplace
        </>
      )}
    </button>
  );
}
