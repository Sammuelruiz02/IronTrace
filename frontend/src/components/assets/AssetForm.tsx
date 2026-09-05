import { useState } from "react";
import {
  MapPin,
  Radar,
  Save,
  X,
} from "lucide-react";

import type {
  Asset,
  AssetFormValues,
  AssetStatus,
  GpsStatus,
} from "../../types/asset";

type ProjectOption = {
  id: number;
  name: string;
};

type AssetFormProps = {
  projects?: ProjectOption[];
  mode: "create" | "edit";
  asset?: Asset | null;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (values: AssetFormValues) => void;
};

const blankForm: AssetFormValues = {
  assetNumber: "",
  assetName: "",
  category: "",
  project: "",
  projectId: null,
  status: "Online",
  gpsStatus: "Unassigned",
  assignedTo: "Unassigned",
  latitude: null,
  longitude: null,
  geofenceEnabled: false,
  geofenceLatitude: null,
  geofenceLongitude: null,
  geofenceRadiusMeters: null,
  notes: "",
};

function AssetForm({
  projects = [],
  mode,
  asset,
  errorMessage,
  onClose,
  onSubmit,
}: AssetFormProps) {
  const [form, setForm] = useState<AssetFormValues>(() => {
    if (mode === "edit" && asset) {
      return {
        assetNumber: asset.assetNumber,
        assetName: asset.assetName,
        category: asset.category,
        project: asset.project,
        projectId: asset.projectId,
        status: asset.status,
        gpsStatus: asset.gpsStatus,
        assignedTo: asset.assignedTo,
        latitude: asset.latitude,
        longitude: asset.longitude,
        geofenceEnabled: asset.geofenceEnabled,
        geofenceLatitude: asset.geofenceLatitude,
        geofenceLongitude: asset.geofenceLongitude,
        geofenceRadiusMeters: asset.geofenceRadiusMeters,
        notes: asset.notes,
      };
    }

    return blankForm;
  });

  const [localError, setLocalError] = useState("");

  const updateField = <K extends keyof AssetFormValues>(
    field: K,
    value: AssetFormValues[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCoordinate = (
    field:
      | "latitude"
      | "longitude"
      | "geofenceLatitude"
      | "geofenceLongitude"
      | "geofenceRadiusMeters",
    value: string,
  ) => {
    if (value.trim() === "") {
      updateField(field, null);
      return;
    }

    const numericValue = Number(value);

    if (!Number.isNaN(numericValue)) {
      updateField(field, numericValue);
    }
  };

  const handleProjectChange = (value: string) => {
    if (!value) {
      setForm((current) => ({
        ...current,
        projectId: null,
        project: "",
      }));
      return;
    }

    const projectId = Number(value);

    const selectedProject = projects.find(
      (project) => project.id === projectId,
    );

    if (!selectedProject) {
      return;
    }

    setForm((current) => ({
      ...current,
      projectId: selectedProject.id,
      project: selectedProject.name,
    }));
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !form.assetNumber.trim() ||
      !form.assetName.trim() ||
      !form.category.trim()
    ) {
      setLocalError(
        "Asset number, name, and category are required.",
      );
      return;
    }

    if (form.projectId === null) {
      setLocalError("Please select a project.");
      return;
    }

    if (
      form.latitude !== null &&
      (form.latitude < -90 || form.latitude > 90)
    ) {
      setLocalError(
        "Latitude must be between -90 and 90.",
      );
      return;
    }

    if (
      form.longitude !== null &&
      (form.longitude < -180 || form.longitude > 180)
    ) {
      setLocalError(
        "Longitude must be between -180 and 180.",
      );
      return;
    }

    const hasLatitude = form.latitude !== null;
    const hasLongitude = form.longitude !== null;

    if (hasLatitude !== hasLongitude) {
      setLocalError(
        "Enter both latitude and longitude, or leave both blank.",
      );
      return;
    }

    if (form.geofenceEnabled) {
      if (
        form.geofenceLatitude === null ||
        form.geofenceLongitude === null ||
        form.geofenceRadiusMeters === null
      ) {
        setLocalError(
          "Geofence latitude, longitude, and radius are required when geofencing is enabled.",
        );
        return;
      }

      if (
        form.geofenceLatitude < -90 ||
        form.geofenceLatitude > 90
      ) {
        setLocalError(
          "Geofence latitude must be between -90 and 90.",
        );
        return;
      }

      if (
        form.geofenceLongitude < -180 ||
        form.geofenceLongitude > 180
      ) {
        setLocalError(
          "Geofence longitude must be between -180 and 180.",
        );
        return;
      }

      if (form.geofenceRadiusMeters <= 0) {
        setLocalError(
          "Geofence radius must be greater than 0 meters.",
        );
        return;
      }
    }

    setLocalError("");

    onSubmit({
      ...form,
      assetNumber: form.assetNumber.trim(),
      assetName: form.assetName.trim(),
      category: form.category.trim(),
      project: form.project.trim(),
      projectId: form.projectId,
      assignedTo: form.assignedTo.trim() || "Unassigned",
      notes: form.notes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-form-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Asset management
            </p>

            <h2
              id="asset-form-title"
              className="mt-1 text-xl font-bold text-slate-950"
            >
              {mode === "create"
                ? "Add new asset"
                : "Edit asset"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter equipment, project, GPS, and geofence information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close asset form"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {(localError || errorMessage) && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {localError || errorMessage}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Asset number" required>
              <input
                value={form.assetNumber}
                onChange={(event) =>
                  updateField(
                    "assetNumber",
                    event.target.value,
                  )
                }
                placeholder="1005"
                className="field-input"
              />
            </Field>

            <Field label="Asset name" required>
              <input
                value={form.assetName}
                onChange={(event) =>
                  updateField(
                    "assetName",
                    event.target.value,
                  )
                }
                placeholder="Boom Lift 12"
                className="field-input"
              />
            </Field>

            <Field label="Category" required>
              <input
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value,
                  )
                }
                placeholder="Aerial Equipment"
                className="field-input"
              />
            </Field>

            <Field label="Project" required>
              <select
                value={form.projectId ?? ""}
                onChange={(event) =>
                  handleProjectChange(
                    event.target.value,
                  )
                }
                className="field-input"
              >
                <option value="">
                  Select a project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              {projects.length === 0 && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  No projects are available. Create a project first.
                </p>
              )}
            </Field>

            <Field label="Operational status">
              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as AssetStatus,
                  )
                }
                className="field-input"
              >
                <option value="Online">
                  Online
                </option>
                <option value="Offline">
                  Offline
                </option>
                <option value="Maintenance">
                  Maintenance
                </option>
              </select>
            </Field>

            <Field label="GPS status">
              <select
                value={form.gpsStatus}
                onChange={(event) =>
                  updateField(
                    "gpsStatus",
                    event.target.value as GpsStatus,
                  )
                }
                className="field-input"
              >
                <option value="Live">
                  Live
                </option>
                <option value="Stale">
                  Stale
                </option>
                <option value="Offline">
                  Offline
                </option>
                <option value="Unassigned">
                  Unassigned
                </option>
              </select>
            </Field>

            <Field
              label="Assigned to"
              className="md:col-span-2"
            >
              <input
                value={form.assignedTo}
                onChange={(event) =>
                  updateField(
                    "assignedTo",
                    event.target.value,
                  )
                }
                placeholder="Employee or team"
                className="field-input"
              />
            </Field>

            <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white">
                  <MapPin size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    GPS location
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Enter both coordinates to place this asset on the map.
                    Leave both blank if no location is available.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Latitude">
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={form.latitude ?? ""}
                    onChange={(event) =>
                      updateCoordinate(
                        "latitude",
                        event.target.value,
                      )
                    }
                    placeholder="28.291956"
                    className="field-input bg-white"
                  />
                </Field>

                <Field label="Longitude">
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={form.longitude ?? ""}
                    onChange={(event) =>
                      updateCoordinate(
                        "longitude",
                        event.target.value,
                      )
                    }
                    placeholder="-81.407570"
                    className="field-input bg-white"
                  />
                </Field>
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white">
                    <Radar size={19} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Geofence
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Create an authorized radius around the jobsite for this asset.
                    </p>
                  </div>
                </div>

                <label className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.geofenceEnabled}
                    onChange={(event) =>
                      updateField(
                        "geofenceEnabled",
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Enabled
                </label>
              </div>

              {form.geofenceEnabled && (
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <Field label="Center latitude">
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={form.geofenceLatitude ?? ""}
                      onChange={(event) =>
                        updateCoordinate(
                          "geofenceLatitude",
                          event.target.value,
                        )
                      }
                      placeholder="28.291956"
                      className="field-input bg-white"
                    />
                  </Field>

                  <Field label="Center longitude">
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={form.geofenceLongitude ?? ""}
                      onChange={(event) =>
                        updateCoordinate(
                          "geofenceLongitude",
                          event.target.value,
                        )
                      }
                      placeholder="-81.407570"
                      className="field-input bg-white"
                    />
                  </Field>

                  <Field label="Radius (meters)">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={form.geofenceRadiusMeters ?? ""}
                      onChange={(event) =>
                        updateCoordinate(
                          "geofenceRadiusMeters",
                          event.target.value,
                        )
                      }
                      placeholder="150"
                      className="field-input bg-white"
                    />
                  </Field>
                </div>
              )}
            </div>

            <Field
              label="Notes"
              className="md:col-span-2"
            >
              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value,
                  )
                }
                placeholder="Add maintenance, assignment, or tracking notes."
                rows={4}
                className="field-input resize-y"
              />
            </Field>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Save size={17} />
              {mode === "create"
                ? "Save asset"
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

function Field({
  label,
  required,
  className = "",
  children,
}: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

export default AssetForm;
