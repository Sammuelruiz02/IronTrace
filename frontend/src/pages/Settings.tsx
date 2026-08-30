import {
    Building2,
    Check,
    Crown,
    Loader2,
    LockKeyhole,
    Settings as SettingsIcon,
    ShieldCheck,
    UserCog,
    Users,
  } from "lucide-react";
  
  import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    getAuthenticatedUser,
  } from "../auth";
  
  import type {
    UserRole,
  } from "../auth";
  
  import {
    getTeam,
    updateTeamMemberRole,
  } from "../api/team";
  
  import Sidebar from "../components/Sidebar";
  import TopBar from "../components/TopBar";
  
  import type {
    TeamMember,
  } from "../types/team";
  
  
  function Settings() {
    const user =
      getAuthenticatedUser();
  
    const [
      team,
      setTeam,
    ] =
      useState<TeamMember[]>([]);
  
    const [
      loading,
      setLoading,
    ] =
      useState(false);
  
    const [
      pageError,
      setPageError,
    ] =
      useState("");
  
    const [
      successMessage,
      setSuccessMessage,
    ] =
      useState("");
  
    const [
      processingUserId,
      setProcessingUserId,
    ] =
      useState<number | null>(
        null
      );
  
  
    const isAdmin =
      user?.role === "admin";
  
  
    const loadTeam =
      useCallback(async () => {
        if (!isAdmin) {
          return;
        }
  
        try {
          setLoading(true);
          setPageError("");
  
          const data =
            await getTeam();
  
          setTeam(data);
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load team."
          );
        } finally {
          setLoading(false);
        }
      }, [isAdmin]);
  
  
    useEffect(() => {
      void loadTeam();
    }, [loadTeam]);
  
  
    const roleCounts =
      useMemo(() => {
        return {
          admin:
            team.filter(
              (member) =>
                member.role ===
                "admin"
            ).length,
  
          manager:
            team.filter(
              (member) =>
                member.role ===
                "manager"
            ).length,
  
          member:
            team.filter(
              (member) =>
                member.role ===
                "member"
            ).length,
        };
      }, [team]);
  
  
    const handleRoleChange =
      async (
        member: TeamMember,
        role: UserRole
      ) => {
        if (
          member.role === role
        ) {
          return;
        }
  
        try {
          setProcessingUserId(
            member.id
          );
  
          setPageError("");
          setSuccessMessage("");
  
          const updated =
            await updateTeamMemberRole(
              member.id,
              role
            );
  
          setTeam((current) =>
            current.map((item) =>
              item.id === updated.id
                ? updated
                : item
            )
          );
  
          setSuccessMessage(
            `${updated.full_name}'s role was changed to ${formatRole(
              updated.role
            )}.`
          );
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to update role."
          );
        } finally {
          setProcessingUserId(
            null
          );
        }
      };
  
  
    if (!user) {
      return null;
    }
  
  
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
  
        <div className="min-w-0 flex-1">
          <TopBar title="Settings" />
  
          <main className="p-5 sm:p-7 lg:p-8">
            <div className="mx-auto max-w-[1500px]">
  
              {/* HEADER */}
  
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                  Organization management
                </p>
  
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                  Settings
                </h1>
  
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Review your account,
                  organization access, and
                  IronTrace role permissions.
                </p>
              </div>
  
  
              {pageError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {pageError}
                </div>
              )}
  
  
              {successMessage && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <Check size={17} />
  
                  {successMessage}
                </div>
              )}
  
  
              {/* ACCOUNT */}
  
              <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
  
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
  
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Building2
                        size={23}
                      />
                    </div>
  
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Company account
                      </p>
  
                      <h2 className="mt-1 text-xl font-bold text-slate-950">
                        {user.company_name ||
                          "IronTrace Organization"}
                      </h2>
  
                      <p className="mt-1 text-sm text-slate-500">
                        Organization ID:{" "}
                        {user.organization_id ??
                          "Not assigned"}
                      </p>
                    </div>
                  </div>
  
  
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
  
                    <AccountDetail
                      label="Signed in as"
                      value={
                        user.full_name
                      }
                    />
  
                    <AccountDetail
                      label="Email"
                      value={user.email}
                    />
  
                    <AccountDetail
                      label="Role"
                      value={formatRole(
                        user.role
                      )}
                    />
  
                    <AccountDetail
                      label="Account status"
                      value={
                        user.is_active
                          ? "Active"
                          : "Inactive"
                      }
                    />
  
                  </div>
                </div>
  
  
                {/* CURRENT ROLE */}
  
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                      <ShieldCheck
                        size={21}
                      />
                    </div>
  
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Your access
                      </p>
  
                      <h2 className="mt-1 text-lg font-bold text-slate-950">
                        {formatRole(
                          user.role
                        )}
                      </h2>
                    </div>
                  </div>
  
  
                  <div className="mt-5 space-y-3">
  
                    {getRolePermissions(
                      user.role
                    ).map(
                      (permission) => (
                        <div
                          key={
                            permission
                          }
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Check
                              size={12}
                            />
                          </div>
  
                          <p className="text-sm leading-5 text-slate-600">
                            {permission}
                          </p>
                        </div>
                      )
                    )}
  
                  </div>
                </div>
              </section>
  
  
              {/* PERMISSION MATRIX */}
  
              <section className="mt-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-950">
                    IronTrace roles
                  </h2>
  
                  <p className="mt-1 text-sm text-slate-500">
                    Roles determine what each
                    organization user can view
                    and manage.
                  </p>
                </div>
  
  
                <div className="grid gap-4 lg:grid-cols-3">
  
                  <RoleCard
                    role="Admin"
                    icon={
                      <Crown size={20} />
                    }
                    description="Full organization control and destructive actions."
                    permissions={[
                      "View all organization data",
                      "Create and edit assets",
                      "Manage projects and trackers",
                      "Resolve alerts",
                      "Manage team roles",
                      "Delete assets, projects, and trackers",
                    ]}
                    active={
                      user.role ===
                      "admin"
                    }
                  />
  
  
                  <RoleCard
                    role="Manager"
                    icon={
                      <UserCog size={20} />
                    }
                    description="Operational management without organization-level deletion rights."
                    permissions={[
                      "View organization data",
                      "Create and edit assets",
                      "Manage projects",
                      "Manage tracker assignments",
                      "Submit manual GPS updates",
                      "Resolve alerts",
                    ]}
                    active={
                      user.role ===
                      "manager"
                    }
                  />
  
  
                  <RoleCard
                    role="Member"
                    icon={
                      <Users size={20} />
                    }
                    description="Read-focused access for operations and field users."
                    permissions={[
                      "View assets",
                      "View projects",
                      "View GPS and map data",
                      "View geofence events",
                      "View notifications",
                      "Mark notifications as read",
                    ]}
                    active={
                      user.role ===
                      "member"
                    }
                  />
  
                </div>
              </section>
  
  
              {/* TEAM MANAGEMENT */}
  
              <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
  
                  <div>
                    <div className="flex items-center gap-2">
                      <Users
                        size={19}
                        className="text-blue-700"
                      />
  
                      <h2 className="text-lg font-bold text-slate-950">
                        Organization team
                      </h2>
                    </div>
  
                    <p className="mt-1 text-sm text-slate-500">
                      Manage access levels for
                      users in your
                      organization.
                    </p>
                  </div>
  
  
                  {isAdmin &&
                    !loading && (
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
  
                        <span className="rounded-full bg-purple-50 px-3 py-1.5 text-purple-700">
                          {
                            roleCounts.admin
                          }{" "}
                          Admin
                        </span>
  
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                          {
                            roleCounts.manager
                          }{" "}
                          Manager
                        </span>
  
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                          {
                            roleCounts.member
                          }{" "}
                          Member
                        </span>
  
                      </div>
                    )}
                </div>
  
  
                {!isAdmin ? (
  
                  <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center">
  
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <LockKeyhole
                        size={25}
                      />
                    </div>
  
                    <h3 className="mt-4 font-bold text-slate-900">
                      Admin access required
                    </h3>
  
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Team membership and role
                      management are restricted
                      to organization
                      administrators.
                    </p>
  
                  </div>
  
                ) : loading ? (
  
                  <div className="flex min-h-[250px] items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
  
                    Loading team...
                  </div>
  
                ) : team.length === 0 ? (
  
                  <div className="p-10 text-center text-sm text-slate-500">
                    No team members found.
                  </div>
  
                ) : (
  
                  <div className="overflow-x-auto">
  
                    <table className="w-full min-w-[850px]">
  
                      <thead className="border-b border-slate-200 bg-slate-50">
  
                        <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
  
                          <th className="px-5 py-4">
                            User
                          </th>
  
                          <th className="px-5 py-4">
                            Status
                          </th>
  
                          <th className="px-5 py-4">
                            Current role
                          </th>
  
                          <th className="px-5 py-4">
                            Access level
                          </th>
  
                        </tr>
  
                      </thead>
  
  
                      <tbody className="divide-y divide-slate-100">
  
                        {team.map(
                          (member) => (
  
                            <TeamRow
                              key={
                                member.id
                              }
                              member={
                                member
                              }
                              isCurrentUser={
                                member.id ===
                                user.id
                              }
                              processing={
                                processingUserId ===
                                member.id
                              }
                              onRoleChange={
                                handleRoleChange
                              }
                            />
  
                          )
                        )}
  
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
  
  
              <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
  
                <div className="flex items-start gap-3">
  
                  <SettingsIcon
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />
  
                  <div>
                    <h3 className="font-bold text-blue-950">
                      Organization isolation
                    </h3>
  
                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Assets, projects,
                      trackers, alerts, and
                      users are scoped to your
                      IronTrace organization.
                      Users from another
                      organization cannot view
                      your company data.
                    </p>
                  </div>
  
                </div>
              </section>
  
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  
  type TeamRowProps = {
    member: TeamMember;
  
    isCurrentUser: boolean;
    processing: boolean;
  
    onRoleChange: (
      member: TeamMember,
      role: UserRole
    ) => void;
  };
  
  
  function TeamRow({
    member,
    isCurrentUser,
    processing,
    onRoleChange,
  }: TeamRowProps) {
    return (
      <tr className="hover:bg-slate-50">
  
        <td className="px-5 py-4">
  
          <div className="flex items-center gap-3">
  
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
              {getInitials(
                member.full_name
              )}
            </div>
  
            <div>
              <div className="flex items-center gap-2">
  
                <p className="text-sm font-bold text-slate-950">
                  {
                    member.full_name
                  }
                </p>
  
                {isCurrentUser && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
                    You
                  </span>
                )}
  
              </div>
  
              <p className="mt-1 text-xs text-slate-500">
                {member.email}
              </p>
            </div>
  
          </div>
        </td>
  
  
        <td className="px-5 py-4">
  
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
              member.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {member.is_active
              ? "Active"
              : "Inactive"}
          </span>
  
        </td>
  
  
        <td className="px-5 py-4">
  
          <RoleBadge
            role={member.role}
          />
  
        </td>
  
  
        <td className="px-5 py-4">
  
          <div className="flex items-center gap-2">
  
            <select
              value={member.role}
              disabled={processing}
              onChange={(event) =>
                onRoleChange(
                  member,
                  event.target
                    .value as UserRole
                )
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="admin">
                Admin
              </option>
  
              <option value="manager">
                Manager
              </option>
  
              <option value="member">
                Member
              </option>
            </select>
  
  
            {processing && (
              <Loader2
                size={16}
                className="animate-spin text-blue-700"
              />
            )}
  
          </div>
  
        </td>
      </tr>
    );
  }
  
  
  function AccountDetail({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
  
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
  
        <p className="mt-2 break-words text-sm font-bold text-slate-900">
          {value}
        </p>
  
      </div>
    );
  }
  
  
  type RoleCardProps = {
    role: string;
    description: string;
    permissions: string[];
  
    icon: React.ReactNode;
    active: boolean;
  };
  
  
  function RoleCard({
    role,
    description,
    permissions,
    icon,
    active,
  }: RoleCardProps) {
    return (
      <div
        className={`rounded-xl border bg-white p-5 shadow-sm ${
          active
            ? "border-blue-300 ring-2 ring-blue-100"
            : "border-slate-200"
        }`}
      >
  
        <div className="flex items-start justify-between gap-3">
  
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            {icon}
          </div>
  
          {active && (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
              Your role
            </span>
          )}
  
        </div>
  
  
        <h3 className="mt-4 text-lg font-bold text-slate-950">
          {role}
        </h3>
  
        <p className="mt-1 min-h-[42px] text-sm leading-5 text-slate-500">
          {description}
        </p>
  
  
        <div className="mt-4 space-y-2">
  
          {permissions.map(
            (permission) => (
              <div
                key={permission}
                className="flex items-start gap-2"
              >
                <Check
                  size={14}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
  
                <span className="text-xs leading-5 text-slate-600">
                  {permission}
                </span>
              </div>
            )
          )}
  
        </div>
  
      </div>
    );
  }
  
  
  function RoleBadge({
    role,
  }: {
    role: UserRole;
  }) {
    const classes = {
      admin:
        "bg-purple-100 text-purple-700",
  
      manager:
        "bg-blue-100 text-blue-700",
  
      member:
        "bg-slate-100 text-slate-600",
    };
  
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${classes[role]}`}
      >
        {formatRole(role)}
      </span>
    );
  }
  
  
  function getRolePermissions(
    role: UserRole
  ) {
    if (role === "admin") {
      return [
        "Full asset, project, and tracker management",
        "Delete organization equipment and projects",
        "Manage user roles and team access",
        "Resolve security notifications",
      ];
    }
  
    if (role === "manager") {
      return [
        "Create and edit assets",
        "Manage projects and tracker assignments",
        "Submit GPS and geofence changes",
        "Resolve security notifications",
      ];
    }
  
    return [
      "View organization assets and projects",
      "View Live Map and GPS information",
      "View geofence events and alerts",
      "Mark notifications as read",
    ];
  }
  
  
  function formatRole(
    role: UserRole
  ) {
    return (
      role.charAt(0).toUpperCase() +
      role.slice(1)
    );
  }
  
  
  function getInitials(
    value: string
  ) {
    const parts =
      value
        .trim()
        .split(/\s+/)
        .filter(Boolean);
  
    if (
      parts.length === 0
    ) {
      return "?";
    }
  
    return parts
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
            .toUpperCase()
      )
      .join("");
  }
  
  
  export default Settings;