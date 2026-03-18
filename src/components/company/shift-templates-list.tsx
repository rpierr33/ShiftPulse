"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteShiftTemplate } from "@/actions/shifts";
import { Clock, MapPin, Users, Trash2 } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";

interface ShiftTemplate {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  daysOfWeek: DayOfWeek[];
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function ShiftTemplatesList({ templates }: { templates: ShiftTemplate[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(templateId: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setDeletingId(templateId);
    await deleteShiftTemplate(templateId);
    router.refresh();
    setDeletingId(null);
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-gray-500 text-center">No shift templates yet. Create one above to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{template.title}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(template.id)}
                disabled={deletingId === template.id}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} />
              <span>{template.startTime} - {template.endTime}</span>
            </div>

            {template.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{template.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={14} />
              <span>Capacity: {template.capacity}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DAY_ORDER.filter((d) => template.daysOfWeek.includes(d)).map((day) => (
                <Badge key={day} variant="default">
                  {DAY_SHORT[day]}
                </Badge>
              ))}
            </div>

            {template.description && (
              <p className="text-xs text-gray-500">{template.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
