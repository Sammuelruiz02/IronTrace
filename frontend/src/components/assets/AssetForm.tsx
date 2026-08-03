import { useState } from "react";
import { Save, X } from "lucide-react";
import type {
  Asset,
  AssetFormValues,
  AssetStatus,
  GpsStatus,
} from "../../types/asset";

type AssetFormProps = {
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
  status: "Online",
  gpsStatus: "Unassigned",
  assignedTo: "Unassigned",
  notes: "",
};

function AssetForm({
  mode,
  asset,
  errorMessage,
  onClose,
  onSubmit,
}: AssetFormProps) {
  const [form, setForm] = useState<AssetFormValues>(() =>
    mode === "edit" && asset ? { ...asset } : blankForm,
  );

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

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !form.assetNumber.trim() ||
      !form.assetName.trim() ||
      !form.category.trim() ||
      !form.project.trim()
    ) {
      setLocalError(
        "Asset number, name, category, and project are required.",
      );
      return;
    }

    setLocalError("");

    onSubmit({
      ...form,
      assetNumber: form.assetNumber.trim(),
      assetName: form.assetName.trim(),
      category: form.category.trim(),
      project: form.project.trim(),
      assignedTo:
        form.assignedTo.trim() || "Unassigned",
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
              Enter the equipment and tracking
              information below.
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

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
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
              <input
                value={form.project}
                onChange={(event) =>
                  updateField(
                    "project",
                    event.target.value,
                  )
                }
                placeholder="Disney Project"
                className="field-input"
              />
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