import {
    Building2,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Edit3,
    Loader2,
    MapPin,
    Package,
    Plus,
    Search,
    Trash2,
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
    createProject,
    deleteProject,
    getProjects,
    updateProject,
  } from "../api/projects";
  
  import Sidebar from "../components/Sidebar";
  import TopBar from "../components/TopBar";
  
  import type {
    Project,
    ProjectAsset,
    ProjectFormValues,
  } from "../types/project";
  
  
  const API_BASE_URL =
    import.meta.env.VITE_API_URL;
  
  
  const emptyForm: ProjectFormValues = {
    name: "",
    code: "",
    address: "",
    status: "Active",
    notes: "",
  };
  
  
  function Projects() {
    const user = getAuthenticatedUser();
  
    const [projects, setProjects] =
      useState<Project[]>([]);
  
    const [assets, setAssets] =
      useState<ProjectAsset[]>([]);
  
    const [loading, setLoading] =
      useState(true);
  
    const [pageError, setPageError] =
      useState("");
  
    const [searchTerm, setSearchTerm] =
      useState("");
  
    const [statusFilter, setStatusFilter] =
      useState("All");
  
    const [selectedProject, setSelectedProject] =
      useState<Project | null>(null);
  
    const [editingProject, setEditingProject] =
      useState<Project | null>(null);
  
    const [deletingProject, setDeletingProject] =
      useState<Project | null>(null);
  
    const [formOpen, setFormOpen] =
      useState(false);
  
    const [formValues, setFormValues] =
      useState<ProjectFormValues>(
        emptyForm
      );
  
    const [formError, setFormError] =
      useState("");
  
    const [saving, setSaving] =
      useState(false);
  
    const [deleting, setDeleting] =
      useState(false);
  
  
    const canManage =
      user?.role === "admin" ||
      user?.role === "manager";
  
    const canDelete =
      user?.role === "admin";
  
  
    const loadData = useCallback(
      async () => {
        try {
          setLoading(true);
          setPageError("");
  
          const [
            projectData,
            assetResponse,
          ] = await Promise.all([
            getProjects(),
  
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
              "Unable to load project assets."
            );
          }
  
          const assetData =
            (await assetResponse.json()) as
              ProjectAsset[];
  
          setProjects(projectData);
          setAssets(assetData);
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load projects."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );
  
  
    useEffect(() => {
      void loadData();
    }, [loadData]);
  
  
    const assetCountByProject =
      useMemo(() => {
        const counts =
          new Map<number, number>();
  
        for (const asset of assets) {
          if (
            asset.project_id === null
          ) {
            continue;
          }
  
          counts.set(
            asset.project_id,
            (
              counts.get(
                asset.project_id
              ) ?? 0
            ) + 1
          );
        }
  
        return counts;
      }, [assets]);
  
  
    const filteredProjects =
      useMemo(() => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();
  
        return projects.filter(
          (project) => {
            const matchesStatus =
              statusFilter === "All" ||
              project.status ===
                statusFilter;
  
            if (!matchesStatus) {
              return false;
            }
  
            if (!search) {
              return true;
            }
  
            return [
              project.name,
              project.code ?? "",
              project.address ?? "",
              project.status,
            ].some((value) =>
              value
                .toLowerCase()
                .includes(search)
            );
          }
        );
      }, [
        projects,
        searchTerm,
        statusFilter,
      ]);
  
  
    const activeCount =
      projects.filter(
        (project) =>
          project.status
            .toLowerCase() ===
          "active"
      ).length;
  
  
    const totalAssignedAssets =
      assets.filter(
        (asset) =>
          asset.project_id !== null
      ).length;
  
  
    const openCreateProject = () => {
      setEditingProject(null);
  
      setFormValues({
        ...emptyForm,
      });
  
      setFormError("");
      setFormOpen(true);
    };
  
  
    const openEditProject = (
      project: Project
    ) => {
      setSelectedProject(null);
      setEditingProject(project);
  
      setFormValues({
        name: project.name,
        code: project.code ?? "",
        address:
          project.address ?? "",
        status: project.status,
        notes: project.notes,
      });
  
      setFormError("");
      setFormOpen(true);
    };
  
  
    const handleSaveProject =
      async () => {
        if (!formValues.name.trim()) {
          setFormError(
            "Project name is required."
          );
  
          return;
        }
  
        try {
          setSaving(true);
          setFormError("");
  
          if (editingProject) {
            const updated =
              await updateProject(
                editingProject.id,
                formValues
              );
  
            setProjects((current) =>
              current.map((project) =>
                project.id ===
                updated.id
                  ? updated
                  : project
              )
            );
  
            // Backend synchronizes legacy
            // Asset.project values on rename.
            setAssets((current) =>
              current.map((asset) =>
                asset.project_id ===
                updated.id
                  ? {
                      ...asset,
                      project:
                        updated.name,
                    }
                  : asset
              )
            );
          } else {
            const created =
              await createProject(
                formValues
              );
  
            setProjects((current) => [
              created,
              ...current,
            ]);
          }
  
          setFormOpen(false);
          setEditingProject(null);
        } catch (error) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Unable to save project."
          );
        } finally {
          setSaving(false);
        }
      };
  
  
    const handleDeleteProject =
      async () => {
        if (!deletingProject) {
          return;
        }
  
        try {
          setDeleting(true);
          setPageError("");
  
          await deleteProject(
            deletingProject.id
          );
  
          const deletedId =
            deletingProject.id;
  
          setProjects((current) =>
            current.filter(
              (project) =>
                project.id !==
                deletedId
            )
          );
  
          // Backend unassigns project assets
          // instead of deleting them.
          setAssets((current) =>
            current.map((asset) =>
              asset.project_id ===
              deletedId
                ? {
                    ...asset,
                    project_id: null,
                    project:
                      "Unassigned",
                  }
                : asset
            )
          );
  
          if (
            selectedProject?.id ===
            deletedId
          ) {
            setSelectedProject(null);
          }
  
          setDeletingProject(null);
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to delete project."
          );
        } finally {
          setDeleting(false);
        }
      };
  
  
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
  
        <div className="min-w-0 flex-1">
          <TopBar title="Projects" />
  
          <main className="p-5 sm:p-7 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
  
              {/* HEADER */}
  
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                    Jobsite management
                  </p>
  
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    Projects
                  </h1>
  
                  <p className="mt-2 text-sm text-slate-600">
                    Organize assets by project,
                    jobsite, and operating
                    location.
                  </p>
                </div>
  
                {canManage && (
                  <button
                    type="button"
                    onClick={
                      openCreateProject
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
                  >
                    <Plus size={18} />
                    Add project
                  </button>
                )}
              </div>
  
  
              {pageError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {pageError}
                </div>
              )}
  
  
              {/* SUMMARY */}
  
              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ProjectStat
                  title="Total projects"
                  value={projects.length}
                  icon={
                    <Building2 size={20} />
                  }
                  tone="blue"
                />
  
                <ProjectStat
                  title="Active projects"
                  value={activeCount}
                  icon={
                    <CheckCircle2
                      size={20}
                    />
                  }
                  tone="green"
                />
  
                <ProjectStat
                  title="Assigned assets"
                  value={
                    totalAssignedAssets
                  }
                  icon={
                    <Package size={20} />
                  }
                  tone="orange"
                />
  
                <ProjectStat
                  title="Unassigned assets"
                  value={
                    assets.filter(
                      (asset) =>
                        asset.project_id ===
                        null
                    ).length
                  }
                  icon={
                    <ClipboardList
                      size={20}
                    />
                  }
                  tone="slate"
                />
              </section>
  
  
              {/* FILTERS */}
  
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row">
  
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
  
                    <input
                      type="search"
                      placeholder="Search projects, code, or address..."
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
  
                    <option value="Completed">
                      Completed
                    </option>
                  </select>
                </div>
              </section>
  
  
              {/* PROJECT GRID */}
  
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-500 shadow-sm">
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
  
                  Loading projects...
                </div>
              ) : filteredProjects.length ===
                0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <Building2
                    size={36}
                    className="text-slate-300"
                  />
  
                  <h2 className="mt-4 text-lg font-bold text-slate-900">
                    No projects found
                  </h2>
  
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Create a project or change
                    your current filters.
                  </p>
                </div>
              ) : (
                <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredProjects.map(
                    (project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        assetCount={
                          assetCountByProject.get(
                            project.id
                          ) ?? 0
                        }
                        canManage={
                          Boolean(
                            canManage
                          )
                        }
                        canDelete={
                          Boolean(
                            canDelete
                          )
                        }
                        onView={() =>
                          setSelectedProject(
                            project
                          )
                        }
                        onEdit={() =>
                          openEditProject(
                            project
                          )
                        }
                        onDelete={() =>
                          setDeletingProject(
                            project
                          )
                        }
                      />
                    )
                  )}
                </section>
              )}
            </div>
          </main>
        </div>
  
  
        {/* CREATE / EDIT */}
  
        {formOpen && (
          <ProjectFormModal
            values={formValues}
            editing={
              Boolean(editingProject)
            }
            saving={saving}
            error={formError}
            onChange={setFormValues}
            onCancel={() => {
              setFormOpen(false);
              setEditingProject(null);
              setFormError("");
            }}
            onSave={
              handleSaveProject
            }
          />
        )}
  
  
        {/* PROJECT DETAILS */}
  
        {selectedProject && (
          <ProjectDetails
            project={
              selectedProject
            }
            assets={assets.filter(
              (asset) =>
                asset.project_id ===
                selectedProject.id
            )}
            canManage={
              Boolean(canManage)
            }
            onEdit={() =>
              openEditProject(
                selectedProject
              )
            }
            onClose={() =>
              setSelectedProject(null)
            }
          />
        )}
  
  
        {/* DELETE */}
  
        {deletingProject && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <Trash2 size={22} />
              </div>
  
              <h2 className="mt-4 text-xl font-bold text-slate-950">
                Delete project?
              </h2>
  
              <p className="mt-2 text-sm leading-6 text-slate-600">
                <strong>
                  {deletingProject.name}
                </strong>{" "}
                will be removed. Assets
                assigned to this project will
                remain in IronTrace and become
                unassigned.
              </p>
  
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeletingProject(
                      null
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
  
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    void handleDeleteProject()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}
  
                  Delete project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  
  type ProjectCardProps = {
    project: Project;
    assetCount: number;
  
    canManage: boolean;
    canDelete: boolean;
  
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
  };
  
  
  function ProjectCard({
    project,
    assetCount,
    canManage,
    canDelete,
    onView,
    onEdit,
    onDelete,
  }: ProjectCardProps) {
    return (
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <button
          type="button"
          onClick={onView}
          className="block w-full p-5 text-left"
        >
          <div className="flex items-start justify-between gap-4">
  
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 size={21} />
            </div>
  
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                project.status
                  .toLowerCase() ===
                "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : project.status
                      .toLowerCase() ===
                    "completed"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {project.status}
            </span>
          </div>
  
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            {project.name}
          </h2>
  
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {project.code ||
              "No project code"}
          </p>
  
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <MapPin
                size={15}
                className="shrink-0 text-slate-400"
              />
  
              {project.address ||
                "No address provided"}
            </p>
  
            <p className="flex items-center gap-2">
              <Package
                size={15}
                className="text-slate-400"
              />
  
              {assetCount}{" "}
              {assetCount === 1
                ? "asset"
                : "assets"}
            </p>
          </div>
  
          <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
            View project
            <ChevronRight size={16} />
          </div>
        </button>
  
        {(canManage ||
          canDelete) && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
  
            {canManage && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
  
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </article>
    );
  }
  
  
  type ProjectFormModalProps = {
    values: ProjectFormValues;
    editing: boolean;
    saving: boolean;
    error: string;
  
    onChange: (
      values: ProjectFormValues
    ) => void;
  
    onCancel: () => void;
    onSave: () => void;
  };
  
  
  function ProjectFormModal({
    values,
    editing,
    saving,
    error,
    onChange,
    onCancel,
    onSave,
  }: ProjectFormModalProps) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
  
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Project management
              </p>
  
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {editing
                  ? "Edit project"
                  : "Add project"}
              </h2>
            </div>
  
            <button
              type="button"
              onClick={onCancel}
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
  
            <div>
              <label className="text-sm font-bold text-slate-700">
                Project name *
              </label>
  
              <input
                value={values.name}
                onChange={(event) =>
                  onChange({
                    ...values,
                    name:
                      event.target.value,
                  })
                }
                placeholder="Disney Lakeshore Lodge"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
  
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">
                  Project code
                </label>
  
                <input
                  value={values.code}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      code:
                        event.target.value,
                    })
                  }
                  placeholder="DLL-01"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600"
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
  
                  <option value="Completed">
                    Completed
                  </option>
                </select>
              </div>
            </div>
  
            <div>
              <label className="text-sm font-bold text-slate-700">
                Address
              </label>
  
              <input
                value={values.address}
                onChange={(event) =>
                  onChange({
                    ...values,
                    address:
                      event.target.value,
                  })
                }
                placeholder="Project address"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600"
              />
            </div>
  
            <div>
              <label className="text-sm font-bold text-slate-700">
                Notes
              </label>
  
              <textarea
                value={values.notes}
                onChange={(event) =>
                  onChange({
                    ...values,
                    notes:
                      event.target.value,
                  })
                }
                rows={4}
                placeholder="Project notes..."
                className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>
  
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
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
                : "Create project"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  
  type ProjectDetailsProps = {
    project: Project;
    assets: ProjectAsset[];
    canManage: boolean;
  
    onEdit: () => void;
    onClose: () => void;
  };
  
  
  function ProjectDetails({
    project,
    assets,
    canManage,
    onEdit,
    onClose,
  }: ProjectDetailsProps) {
    return (
      <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/50 backdrop-blur-sm">
        <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
  
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Project details
              </p>
  
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {project.name}
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
  
          <div className="p-6">
  
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBox
                label="Project code"
                value={
                  project.code ||
                  "Not assigned"
                }
              />
  
              <DetailBox
                label="Status"
                value={project.status}
              />
  
              <DetailBox
                label="Address"
                value={
                  project.address ||
                  "Not provided"
                }
              />
  
              <DetailBox
                label="Assigned assets"
                value={String(
                  assets.length
                )}
              />
            </div>
  
            {project.notes && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Notes
                </p>
  
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {project.notes}
                </p>
              </div>
            )}
  
            <div className="mt-7 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">
                Project assets
              </h3>
  
              {canManage && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 size={14} />
                  Edit project
                </button>
              )}
            </div>
  
            {assets.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Package
                  size={28}
                  className="mx-auto text-slate-300"
                />
  
                <p className="mt-3 font-bold text-slate-700">
                  No assets assigned
                </p>
  
                <p className="mt-1 text-sm text-slate-500">
                  Assets assigned to this
                  project will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {assets.map(
                    (asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between gap-4 px-4 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <Package
                              size={18}
                            />
                          </div>
  
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
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
                              {asset.category}
                            </p>
                          </div>
                        </div>
  
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-700">
                            {asset.status}
                          </p>
  
                          <p className="mt-1 text-xs text-slate-400">
                            GPS:{" "}
                            {
                              asset.gps_status
                            }
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  
  function DetailBox({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
  
        <p className="mt-2 text-sm font-bold text-slate-900">
          {value}
        </p>
      </div>
    );
  }
  
  
  type ProjectStatProps = {
    title: string;
    value: number;
    icon: React.ReactNode;
  
    tone:
      | "blue"
      | "green"
      | "orange"
      | "slate";
  };
  
  
  const projectStatTone = {
    blue:
      "bg-blue-50 text-blue-700",
  
    green:
      "bg-emerald-50 text-emerald-700",
  
    orange:
      "bg-orange-50 text-orange-700",
  
    slate:
      "bg-slate-100 text-slate-700",
  };
  
  
  function ProjectStat({
    title,
    value,
    icon,
    tone,
  }: ProjectStatProps) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {title}
            </p>
  
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {value}
            </p>
          </div>
  
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${projectStatTone[tone]}`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  }
  
  
  export default Projects;