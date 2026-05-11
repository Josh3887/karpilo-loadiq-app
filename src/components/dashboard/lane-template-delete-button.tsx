"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteLaneTemplate } from "@/services/lane-templates";

type LaneTemplateDeleteButtonProps = {
  templateId: string;
};

export function LaneTemplateDeleteButton({
  templateId,
}: LaneTemplateDeleteButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function handleDelete() {
    try {
      setStatus("Deleting...");
      await deleteLaneTemplate(templateId);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/20"
      >
        Delete
      </button>

      {status && <p className="mt-2 text-xs text-slate-500">{status}</p>}
    </div>
  );
}
