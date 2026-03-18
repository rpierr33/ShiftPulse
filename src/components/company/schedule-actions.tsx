"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishSchedule, unpublishSchedule, deleteSchedule } from "@/actions/company";

export function ScheduleActions({ scheduleId, isPublished }: { scheduleId: string; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleTogglePublish() {
    startTransition(async () => {
      if (isPublished) {
        await unpublishSchedule(scheduleId);
      } else {
        await publishSchedule(scheduleId);
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    startTransition(async () => {
      await deleteSchedule(scheduleId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={isPublished ? "warning" : "success"}
        onClick={handleTogglePublish}
        disabled={isPending}
        loading={isPending}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={isPending}
        loading={isPending}
      >
        Delete
      </Button>
    </div>
  );
}
