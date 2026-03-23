"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Building2,
} from "lucide-react";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation,
} from "@/actions/locations";

type LocationData = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  isActive: boolean;
  _count: { shifts: number };
};

interface LocationsClientProps {
  companyId: string;
  initialLocations: LocationData[];
}

type FormData = {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
};

const emptyForm: FormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  latitude: "",
  longitude: "",
};

export function LocationsClient({
  companyId,
  initialLocations,
}: LocationsClientProps) {
  const [locations, _setLocations] = useState(initialLocations);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(loc: LocationData) {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address ?? "",
      city: loc.city ?? "",
      state: loc.state ?? "",
      zipCode: loc.zipCode ?? "",
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
    });
    setError("");
    setShowModal(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setError("Location name is required");
      return;
    }

    const data = {
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      zipCode: form.zipCode.trim() || undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };

    startTransition(async () => {
      let result;
      if (editingId) {
        result = await updateLocation(editingId, data);
      } else {
        result = await createLocation(companyId, data);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setShowModal(false);
      // Reload to get fresh data — Next.js revalidation handles this via revalidatePath
      window.location.reload();
    });
  }

  function handleDelete(locationId: string, locationName: string) {
    if (!confirm(`Are you sure you want to delete "${locationName}"?`)) return;

    startTransition(async () => {
      const result = await deleteLocation(locationId);
      if (result.error) {
        alert(result.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleSetDefault(locationId: string) {
    startTransition(async () => {
      const result = await setDefaultLocation(locationId);
      if (result.error) {
        alert(result.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <>
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {locations.length} Location{locations.length !== 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your facility locations
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Location
        </Button>
      </div>

      {/* Location cards grid */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No locations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first facility location to get started
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus size={16} />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Card
              key={loc.id}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {loc.name}
                      </h3>
                      {loc.isDefault && (
                        <Badge variant="default" className="mt-0.5 text-[10px]">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!loc.isDefault && (
                      <button
                        onClick={() => handleSetDefault(loc.id)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-500 transition-colors"
                        title="Set as default"
                        disabled={isPending}
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(loc)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                      title="Edit"
                      disabled={isPending}
                    >
                      <Pencil size={14} />
                    </button>
                    {!loc.isDefault && (
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete"
                        disabled={isPending}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {(loc.address || loc.city || loc.state) && (
                  <p className="text-sm text-gray-500 mb-2">
                    {[loc.address, loc.city, loc.state, loc.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {loc._count.shifts} shift{loc._count.shifts !== 1 ? "s" : ""}
                  </span>
                  {loc.latitude != null && loc.longitude != null && (
                    <span className="text-xs text-gray-300 font-mono">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit Location" : "Add Location"}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <Input
              label="Location Name"
              placeholder="e.g., Main Office, North Campus"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Address"
              placeholder="Street address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="State"
                placeholder="FL"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <Input
              label="ZIP Code"
              placeholder="33101"
              value={form.zipCode}
              onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                placeholder="25.7617"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  setForm({ ...form, latitude: e.target.value })
                }
              />
              <Input
                label="Longitude"
                placeholder="-80.1918"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowModal(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {editingId ? "Save Changes" : "Add Location"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
