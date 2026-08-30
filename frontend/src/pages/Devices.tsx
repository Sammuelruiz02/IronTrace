import {
    Cpu,
    Edit3,
    Link2,
    Loader2,
    Plus,
    Radio,
    Search,
    Signal,
    SignalZero,
    Trash2,
    Unlink,
    X,
  } from "lucide-react";
  
  import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    getAuthenticatedUser,
    getAuthorizationHeaders,
  } from "../auth";
  
  import {
    assignDevice,
    createDevice,
    deleteDevice,
    getDevices,
    unassignDevice,
    updateDevice,
  } from "../api/devices";
  
  import Sidebar from "../components/Sidebar";
  import TopBar from "../components/TopBar";
  
  import type {
    DeviceAsset,
    DeviceFormValues,
    TrackerDevice,
  } from "../types/device";
  
  
  const API_BASE_URL =
    import.meta.env.VITE_API_URL;
  
  
  const emptyForm: DeviceFormValues = {
    device_name: "",
    serial_number: "",
    provider: "Manual",
    provider_device_id: "",
    imei: "",
    sim_iccid: "",
    status: "Active",
    notes: "",
  };
  
  
  function Devices() {
    const user =
      getAuthenticatedUser();
  
    const [
      devices,
      setDevices,
    ] = useState<TrackerDevice[]>([]);
  
    const [
      assets,
      setAssets,
    ] = useState<DeviceAsset[]>([]);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      pageError,
      setPageError,
    ] = useState("");
  
    const [
      searchTerm,
      setSearchTerm,
    ] = useState("");
  
    const [
      statusFilter,
      setStatusFilter,
    ] = useState("All");
  
    const [
      formOpen,
      setFormOpen,
    ] = useState(false);
  
    const [
      editingDevice,
      setEditingDevice,
    ] =
      useState<TrackerDevice | null>(
        null
      );
  
    const [
      formValues,
      setFormValues,
    ] =
      useState<DeviceFormValues>(
        emptyForm
      );
  
    const [
      formError,
      setFormError,
    ] = useState("");
  
    const [
      saving,
      setSaving,
    ] = useState(false);
  
    const [
      assignmentDevice,
      setAssignmentDevice,
    ] =
      useState<TrackerDevice | null>(
        null
      );
  
    const [
      assignmentAssetId,
      setAssignmentAssetId,
    ] = useState("");
  
    const [
      processingId,
      setProcessingId,
    ] =
      useState<number | null>(
        null
      );
  
    const [
      deletingDevice,
      setDeletingDevice,
    ] =
      useState<TrackerDevice | null>(
        null
      );
  
  
    const canManage =
      user?.role === "admin" ||
      user?.role === "manager";
  
    const canDelete =
      user?.role === "admin";
  
  
    const loadData =
      useCallback(async () => {
        try {
          setLoading(true);
          setPageError("");
  
          const [
            deviceData,
            assetResponse,
          ] = await Promise.all([
            getDevices(),
  
            fetch(
              `${API_BASE_URL}/assets/`,
              {
                headers: {
                  ...getAuthorizationHeaders(),
                },
              }
            ),
          ]);
  
          if (!assetResponse.ok) {
            throw new Error(
              "Unable to load assets."
            );
          }
  
          const assetData =
            (await assetResponse.json()) as
              DeviceAsset[];
  
          setDevices(deviceData);
          setAssets(assetData);
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load tracker devices."
          );
        } finally {
          setLoading(false);
        }
      }, []);
  
  
    useEffect(() => {
      void loadData();
    }, [loadData]);
  
  
    const filteredDevices =
      useMemo(() => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();
  
        return devices.filter(
          (device) => {
            const statusMatches =
              statusFilter === "All" ||
              device.status ===
                statusFilter;
  
            if (!statusMatches) {
              return false;
            }
  
            if (!search) {
              return true;
            }
  
            return [
              device.device_name,
              device.serial_number,
              device.provider,
              device.provider_device_id ??
                "",
              device.imei ?? "",
              device.sim_iccid ?? "",
            ].some((value) =>
              value
                .toLowerCase()
                .includes(search)
            );
          }
        );
      }, [
        devices,
        searchTerm,
        statusFilter,
      ]);
  
  
    const assignedCount =
      devices.filter(
        (device) =>
          device.asset_id !== null
      ).length;
  
  
    const activeCount =
      devices.filter(
        (device) =>
          device.status
            .toLowerCase() ===
          "active"
      ).length;
  
  
    const communicatingCount =
      devices.filter(
        (device) =>
          device.last_communication_at !==
          null
      ).length;
  
  
    const assetById =
      useMemo(() => {
        return new Map(
          assets.map(
            (asset) => [
              asset.id,
              asset,
            ]
          )
        );
      }, [assets]);
  
  
    const openCreate = () => {
      setEditingDevice(null);
  
      setFormValues({
        ...emptyForm,
      });
  
      setFormError("");
      setFormOpen(true);
    };
  
  
    const openEdit = (
      device: TrackerDevice
    ) => {
      setEditingDevice(device);
  
      setFormValues({
        device_name:
          device.device_name,
  
        serial_number:
          device.serial_number,
  
        provider:
          device.provider,
  
        provider_device_id:
          device.provider_device_id ??
          "",
  
        imei:
          device.imei ?? "",
  
        sim_iccid:
          device.sim_iccid ?? "",
  
        status:
          device.status,
  
        notes:
          device.notes ?? "",
      });
  
      setFormError("");
      setFormOpen(true);
    };
  
  
    const handleSave =
      async () => {
        if (
          !formValues.device_name.trim()
        ) {
          setFormError(
            "Device name is required."
          );
          return;
        }
  
        if (
          !formValues.serial_number.trim()
        ) {
          setFormError(
            "Serial number is required."
          );
          return;
        }
  
        try {
          setSaving(true);
          setFormError("");
  
          if (editingDevice) {
            const updated =
              await updateDevice(
                editingDevice.id,
                formValues
              );
  
            setDevices((current) =>
              current.map(
                (device) =>
                  device.id ===
                  updated.id
                    ? updated
                    : device
              )
            );
          } else {
            const created =
              await createDevice(
                formValues
              );
  
            setDevices((current) => [
              created,
              ...current,
            ]);
          }
  
          setFormOpen(false);
          setEditingDevice(null);
        } catch (error) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Unable to save tracker device."
          );
        } finally {
          setSaving(false);
        }
      };
  
  
    const handleAssign =
      async () => {
        if (
          !assignmentDevice ||
          !assignmentAssetId
        ) {
          return;
        }
  
        try {
          setProcessingId(
            assignmentDevice.id
          );
  
          const updated =
            await assignDevice(
              assignmentDevice.id,
              Number(
                assignmentAssetId
              )
            );
  
          setDevices((current) =>
            current.map(
              (device) =>
                device.id ===
                updated.id
                  ? updated
                  : device
            )
          );
  
          setAssignmentDevice(null);
          setAssignmentAssetId("");
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to assign tracker."
          );
        } finally {
          setProcessingId(null);
        }
      };
  
  
    const handleUnassign =
      async (
        device: TrackerDevice
      ) => {
        try {
          setProcessingId(device.id);
  
          const updated =
            await unassignDevice(
              device.id
            );
  
          setDevices((current) =>
            current.map(
              (item) =>
                item.id === updated.id
                  ? updated
                  : item
            )
          );
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to unassign tracker."
          );
        } finally {
          setProcessingId(null);
        }
      };
  
  
    const handleDelete =
      async () => {
        if (!deletingDevice) {
          return;
        }
  
        try {
          setProcessingId(
            deletingDevice.id
          );
  
          await deleteDevice(
            deletingDevice.id
          );
  
          setDevices((current) =>
            current.filter(
              (device) =>
                device.id !==
                deletingDevice.id
            )
          );
  
          setDeletingDevice(null);
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to delete tracker."
          );
        } finally {
          setProcessingId(null);
        }
      };
  
  
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
  
        <div className="min-w-0 flex-1">
          <TopBar title="Tracker Devices" />
  
          <main className="p-5 sm:p-7 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
  
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                    Hardware management
                  </p>
  
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    Tracker Devices
                  </h1>
  
                  <p className="mt-2 text-sm text-slate-600">
                    Manage GPS tracker
                    inventory, SIM details,
                    device assignments, and
                    communication health.
                  </p>
                </div>
  
                {canManage && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
                  >
                    <Plus size={18} />
  
                    Add tracker
                  </button>
                )}
              </div>
  
  
              {pageError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {pageError}
                </div>
              )}
  
  
              <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DeviceStat
                  label="Total trackers"
                  value={devices.length}
                  icon={<Cpu size={20} />}
                  tone="blue"
                />
  
                <DeviceStat
                  label="Active"
                  value={activeCount}
                  icon={
                    <Radio size={20} />
                  }
                  tone="green"
                />
  
                <DeviceStat
                  label="Assigned"
                  value={assignedCount}
                  icon={
                    <Link2 size={20} />
                  }
                  tone="orange"
                />
  
                <DeviceStat
                  label="Communicating"
                  value={
                    communicatingCount
                  }
                  icon={
                    <Signal size={20} />
                  }
                  tone="slate"
                />
              </section>
  
  
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row">
  
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
  
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search tracker, serial, IMEI, SIM, or provider..."
                      className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
  
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600"
                  >
                    <option value="All">
                      All statuses
                    </option>
  
                    <option value="Active">
                      Active
                    </option>
  
                    <option value="Inactive">
                      Inactive
                    </option>
  
                    <option value="Maintenance">
                      Maintenance
                    </option>
                  </select>
                </div>
              </section>
  
  
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-500 shadow-sm">
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
  
                  Loading tracker devices...
                </div>
              ) : (
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1150px]">
  
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-4">
                            Tracker
                          </th>
  
                          <th className="px-5 py-4">
                            Provider
                          </th>
  
                          <th className="px-5 py-4">
                            IMEI / SIM
                          </th>
  
                          <th className="px-5 py-4">
                            Assigned asset
                          </th>
  
                          <th className="px-5 py-4">
                            Communication
                          </th>
  
                          <th className="px-5 py-4">
                            Status
                          </th>
  
                          <th className="px-5 py-4 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
  
  
                      <tbody className="divide-y divide-slate-100">
                        {filteredDevices.map(
                          (device) => {
                            const asset =
                              device.asset_id !==
                              null
                                ? assetById.get(
                                    device.asset_id
                                  )
                                : undefined;
  
                            return (
                              <tr
                                key={device.id}
                                className="hover:bg-slate-50"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                      <Cpu
                                        size={18}
                                      />
                                    </div>
  
                                    <div>
                                      <p className="text-sm font-bold text-slate-950">
                                        {
                                          device.device_name
                                        }
                                      </p>
  
                                      <p className="mt-1 text-xs text-slate-500">
                                        SN:{" "}
                                        {
                                          device.serial_number
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </td>
  
  
                                <td className="px-5 py-4">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {
                                      device.provider
                                    }
                                  </p>
  
                                  <p className="mt-1 text-xs text-slate-500">
                                    {device.provider_device_id ||
                                      "No provider ID"}
                                  </p>
                                </td>
  
  
                                <td className="px-5 py-4">
                                  <p className="text-xs font-semibold text-slate-700">
                                    IMEI:{" "}
                                    {device.imei ||
                                      "—"}
                                  </p>
  
                                  <p className="mt-1 text-xs text-slate-500">
                                    SIM:{" "}
                                    {device.sim_iccid ||
                                      "—"}
                                  </p>
                                </td>
  
  
                                <td className="px-5 py-4">
                                  {asset ? (
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {
                                          asset.asset_name
                                        }
                                      </p>
  
                                      <p className="mt-1 text-xs text-slate-500">
                                        #
                                        {
                                          asset.asset_number
                                        }{" "}
                                        ·{" "}
                                        {
                                          asset.project
                                        }
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-sm font-semibold text-slate-400">
                                      Unassigned
                                    </span>
                                  )}
                                </td>
  
  
                                <td className="px-5 py-4">
                                  {device.last_communication_at ? (
                                    <div className="flex items-center gap-2">
                                      <Signal
                                        size={16}
                                        className="text-emerald-600"
                                      />
  
                                      <span className="text-xs font-semibold text-slate-700">
                                        {formatDate(
                                          device.last_communication_at
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <SignalZero
                                        size={16}
                                        className="text-slate-400"
                                      />
  
                                      <span className="text-xs font-semibold text-slate-400">
                                        No communication
                                      </span>
                                    </div>
                                  )}
                                </td>
  
  
                                <td className="px-5 py-4">
                                  <span className={statusClass(
                                    device.status
                                  )}>
                                    {
                                      device.status
                                    }
                                  </span>
                                </td>
  
  
                                <td className="px-5 py-4">
                                  <div className="flex justify-end gap-2">
  
                                    {canManage &&
                                      device.asset_id ===
                                        null && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAssignmentDevice(
                                              device
                                            );
  
                                            setAssignmentAssetId(
                                              ""
                                            );
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                        >
                                          <Link2
                                            size={14}
                                          />
  
                                          Assign
                                        </button>
                                      )}
  
  
                                    {canManage &&
                                      device.asset_id !==
                                        null && (
                                        <button
                                          type="button"
                                          disabled={
                                            processingId ===
                                            device.id
                                          }
                                          onClick={() =>
                                            void handleUnassign(
                                              device
                                            )
                                          }
                                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                        >
                                          <Unlink
                                            size={14}
                                          />
  
                                          Unassign
                                        </button>
                                      )}
  
  
                                    {canManage && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEdit(
                                            device
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                      >
                                        <Edit3
                                          size={14}
                                        />
  
                                        Edit
                                      </button>
                                    )}
  
  
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeletingDevice(
                                            device
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2
                                          size={14}
                                        />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
  
  
                  {filteredDevices.length ===
                    0 && (
                    <div className="p-10 text-center">
                      <Cpu
                        size={32}
                        className="mx-auto text-slate-300"
                      />
  
                      <p className="mt-3 font-bold text-slate-700">
                        No tracker devices found
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </main>
        </div>
  
  
        {formOpen && (
          <DeviceFormModal
            values={formValues}
            editing={
              Boolean(
                editingDevice
              )
            }
            saving={saving}
            error={formError}
            onChange={
              setFormValues
            }
            onClose={() => {
              setFormOpen(false);
              setEditingDevice(null);
              setFormError("");
            }}
            onSave={() =>
              void handleSave()
            }
          />
        )}
  
  
        {assignmentDevice && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
  
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Link2 size={22} />
              </div>
  
              <h2 className="mt-4 text-xl font-bold text-slate-950">
                Assign tracker
              </h2>
  
              <p className="mt-2 text-sm text-slate-600">
                Assign{" "}
                <strong>
                  {
                    assignmentDevice.device_name
                  }
                </strong>{" "}
                to an IronTrace asset.
              </p>
  
              <select
                value={
                  assignmentAssetId
                }
                onChange={(event) =>
                  setAssignmentAssetId(
                    event.target.value
                  )
                }
                className="mt-5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
              >
                <option value="">
                  Select asset
                </option>
  
                {assets.map(
                  (asset) => (
                    <option
                      key={asset.id}
                      value={asset.id}
                    >
                      #
                      {
                        asset.asset_number
                      }{" "}
                      —{" "}
                      {
                        asset.asset_name
                      }
                    </option>
                  )
                )}
              </select>
  
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setAssignmentDevice(
                      null
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
  
                <button
                  type="button"
                  disabled={
                    !assignmentAssetId ||
                    processingId ===
                      assignmentDevice.id
                  }
                  onClick={() =>
                    void handleAssign()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Link2 size={16} />
  
                  Assign tracker
                </button>
              </div>
            </div>
          </div>
        )}
  
  
        {deletingDevice && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
  
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <Trash2 size={22} />
              </div>
  
              <h2 className="mt-4 text-xl font-bold text-slate-950">
                Delete tracker?
              </h2>
  
              <p className="mt-2 text-sm leading-6 text-slate-600">
                <strong>
                  {
                    deletingDevice.device_name
                  }
                </strong>{" "}
                will be permanently removed.
              </p>
  
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDeletingDevice(
                      null
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
  
                <button
                  type="button"
                  disabled={
                    processingId ===
                    deletingDevice.id
                  }
                  onClick={() =>
                    void handleDelete()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  Delete tracker
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  
  type DeviceFormModalProps = {
    values: DeviceFormValues;
    editing: boolean;
    saving: boolean;
    error: string;
  
    onChange: (
      values: DeviceFormValues
    ) => void;
  
    onClose: () => void;
    onSave: () => void;
  };
  
  
  function DeviceFormModal({
    values,
    editing,
    saving,
    error,
    onChange,
    onClose,
    onSave,
  }: DeviceFormModalProps) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
  
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Tracker inventory
              </p>
  
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {editing
                  ? "Edit tracker"
                  : "Add tracker"}
              </h2>
            </div>
  
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X size={19} />
            </button>
          </div>
  
  
          <div className="space-y-5 p-6">
  
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
  
            <div className="grid gap-5 sm:grid-cols-2">
  
              <FormInput
                label="Device name *"
                value={
                  values.device_name
                }
                placeholder="Tracker 001"
                onChange={(value) =>
                  onChange({
                    ...values,
                    device_name:
                      value,
                  })
                }
              />
  
              <FormInput
                label="Serial number *"
                value={
                  values.serial_number
                }
                placeholder="IT-TRK-001"
                onChange={(value) =>
                  onChange({
                    ...values,
                    serial_number:
                      value,
                  })
                }
              />
  
              <FormInput
                label="Provider"
                value={
                  values.provider
                }
                placeholder="Manual"
                onChange={(value) =>
                  onChange({
                    ...values,
                    provider:
                      value,
                  })
                }
              />
  
              <FormInput
                label="Provider device ID"
                value={
                  values.provider_device_id
                }
                placeholder="Provider ID"
                onChange={(value) =>
                  onChange({
                    ...values,
                    provider_device_id:
                      value,
                  })
                }
              />
  
              <FormInput
                label="IMEI"
                value={
                  values.imei
                }
                placeholder="15-digit IMEI"
                onChange={(value) =>
                  onChange({
                    ...values,
                    imei: value,
                  })
                }
              />
  
              <FormInput
                label="SIM ICCID"
                value={
                  values.sim_iccid
                }
                placeholder="SIM ICCID"
                onChange={(value) =>
                  onChange({
                    ...values,
                    sim_iccid:
                      value,
                  })
                }
              />
            </div>
  
  
            <div>
              <label className="text-sm font-bold text-slate-700">
                Status
              </label>
  
              <select
                value={values.status}
                onChange={(event) =>
                  onChange({
                    ...values,
                    status:
                      event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
              >
                <option value="Active">
                  Active
                </option>
  
                <option value="Inactive">
                  Inactive
                </option>
  
                <option value="Maintenance">
                  Maintenance
                </option>
              </select>
            </div>
  
  
            <div>
              <label className="text-sm font-bold text-slate-700">
                Notes
              </label>
  
              <textarea
                rows={4}
                value={values.notes}
                onChange={(event) =>
                  onChange({
                    ...values,
                    notes:
                      event.target.value,
                  })
                }
                placeholder="Tracker notes..."
                className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>
  
  
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>
  
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {saving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}
  
              {editing
                ? "Save changes"
                : "Create tracker"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  
  function FormInput({
    label,
    value,
    placeholder,
    onChange,
  }: {
    label: string;
    value: string;
    placeholder: string;
    onChange: (
      value: string
    ) => void;
  }) {
    return (
      <div>
        <label className="text-sm font-bold text-slate-700">
          {label}
        </label>
  
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    );
  }
  
  
  function statusClass(
    status: string
  ) {
    const normalized =
      status.toLowerCase();
  
    if (
      normalized === "active"
    ) {
      return "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700";
    }
  
    if (
      normalized ===
      "maintenance"
    ) {
      return "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700";
    }
  
    return "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600";
  }
  
  
  function formatDate(
    value: string
  ) {
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }
  
    return date.toLocaleString();
  }
  
  
  type DeviceStatProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
  
    tone:
      | "blue"
      | "green"
      | "orange"
      | "slate";
  };
  
  
  const statTones = {
    blue:
      "bg-blue-50 text-blue-700",
  
    green:
      "bg-emerald-50 text-emerald-700",
  
    orange:
      "bg-orange-50 text-orange-700",
  
    slate:
      "bg-slate-100 text-slate-700",
  };
  
  
  function DeviceStat({
    label,
    value,
    icon,
    tone,
  }: DeviceStatProps) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
  
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {label}
            </p>
  
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {value}
            </p>
          </div>
  
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${statTones[tone]}`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  }
  
  
  export default Devices;