import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import {
  addUserToOrganization,
  createOrganizationUserRole,
  deleteOrganizationUserRole,
  getOrganization,
  getOrganizationUserRoles,
  getRoles,
  getUsers,
  Organization,
  OrganizationUserRole,
  Role,
  User
} from "../services/adminData";
import { generateRandomPassword } from "../utils/password";

type OrganizationDetailData = {
  organization: Organization;
  users: ReadonlyArray<User>;
  roles: ReadonlyArray<Role>;
  organizationUserRoles: ReadonlyArray<OrganizationUserRole>;
};

export function OrganizationDetailPage() {
  const { organizationId = "" } = useParams();
  const [userMode, setUserMode] = useState<"existing" | "new">("existing");
  const [userId, setUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");

  const detailProgram = useMemo(
    () =>
      Effect.all({
        organization: getOrganization(organizationId),
        users: getUsers(),
        roles: getRoles(),
        organizationUserRoles: getOrganizationUserRoles()
      }).pipe(
        Effect.map((data): OrganizationDetailData => ({
          ...data,
          organizationUserRoles: data.organizationUserRoles.filter(
            (item) => item.organizationId === organizationId
          )
        }))
      ),
    [organizationId, reloadKey]
  );

  const detail = useEffectQuery(detailProgram);
  const normalizedNewUserEmail = newUserEmail.trim().toLowerCase();
  const isDuplicate =
    userMode === "existing" &&
    detail.status === "success" &&
    detail.data.organizationUserRoles.some(
      (item) => item.userId === userId && item.roleId === roleId
    );
  const isEmailDuplicate =
    userMode === "new" &&
    detail.status === "success" &&
    detail.data.users.some((user) => user.email.toLowerCase() === normalizedNewUserEmail);
  const isExistingUserFormValid =
    userMode === "existing" && userId !== "" && roleId !== "" && !isDuplicate;
  const isNewUserFormValid =
    userMode === "new" &&
    newUserName.trim() !== "" &&
    normalizedNewUserEmail !== "" &&
    newUserPassword.trim() !== "" &&
    roleId !== "" &&
    !isEmailDuplicate;
  const isFormValid =
    organizationId !== "" && (isExistingUserFormValid || isNewUserFormValid);

  const resetForm = () => {
    setUserId("");
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setRoleId("");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const onSuccess = () => {
      resetForm();
      setStatus("success");
      setReloadKey((current) => current + 1);
    };

    const onError = () => {
      setStatus("error");
    };

    if (userMode === "existing") {
      void Effect.runPromise(
        createOrganizationUserRole({
          organizationId,
          userId,
          roleId
        })
      ).then(onSuccess, onError);

      return;
    }

    void Effect.runPromise(
      addUserToOrganization({
        organizationId,
        roleId,
        user: {
          name: newUserName.trim(),
          email: normalizedNewUserEmail,
          password: newUserPassword
        }
      })
    ).then(onSuccess, onError);
  };

  const onRemove = (organizationUserRole: OrganizationUserRole) => {
    setDeleteStatus("deleting");

    void Effect.runPromise(deleteOrganizationUserRole(organizationUserRole.id)).then(
      () => {
        setDeleteStatus("idle");
        setReloadKey((current) => current + 1);
      },
      () => {
        setDeleteStatus("error");
      }
    );
  };

  const onGeneratePassword = () => {
    setNewUserPassword(generateRandomPassword());
  };

  if (detail.status === "loading") {
    return <PageFrame title="Organization">Loading...</PageFrame>;
  }

  if (detail.status === "error") {
    return <PageFrame title="Organization">Unable to load organization.</PageFrame>;
  }

  const usersById = new Map(detail.data.users.map((user) => [user.id, user]));
  const rolesById = new Map(detail.data.roles.map((role) => [role.id, role]));

  return (
    <>
      <header className="mb-[22px] grid gap-2">
        <Link className="text-sm font-bold text-cyan-800 no-underline" to="/organizations">
          Back to organizations
        </Link>
        <div>
          <h1 className="m-0 text-3xl font-bold tracking-normal">{detail.data.organization.name}</h1>
          <p className="mt-1 mb-0 text-sm text-slate-500">{detail.data.organization.code}</p>
        </div>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            className={[
              "min-h-9 rounded-md px-3 font-bold transition-colors",
              userMode === "existing" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            ].join(" ")}
            type="button"
            onClick={() => {
              setUserMode("existing");
              resetForm();
              setStatus("idle");
            }}
          >
            Existing user
          </button>
          <button
            className={[
              "min-h-9 rounded-md px-3 font-bold transition-colors",
              userMode === "new" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            ].join(" ")}
            type="button"
            onClick={() => {
              setUserMode("new");
              resetForm();
              setStatus("idle");
            }}
          >
            New user
          </button>
        </div>

        <form
          className={
            userMode === "existing"
              ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"
              : "grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_minmax(200px,1fr)_minmax(260px,1.2fr)_minmax(180px,.8fr)_auto]"
          }
          onSubmit={onSubmit}
        >
          {userMode === "existing" ? (
            <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-600">
              User
              <select
                className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
                required
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              >
                <option value="">Select user</option>
                {detail.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-600">
                Name
                <input
                  className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
                  required
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-600">
                Email
                <input
                  className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
                  required
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-600">
                Password
                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
                    required
                    type="text"
                    value={newUserPassword}
                    onChange={(event) => setNewUserPassword(event.target.value)}
                  />
                  <button
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100"
                    type="button"
                    onClick={onGeneratePassword}
                  >
                    Generate
                  </button>
                </div>
              </label>
            </>
          )}

          <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-600">
            Role
            <select
              className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <option value="">Select role</option>
              {detail.data.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <button
            className="min-h-11 self-end rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={status === "submitting" || !isFormValid}
            type="submit"
          >
            {status === "submitting" ? "Saving..." : userMode === "existing" ? "Add user" : "Create user"}
          </button>
        </form>

        {isDuplicate && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            This user already has this role in the organization.
          </p>
        )}

        {isEmailDuplicate && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            A user with this email already exists.
          </p>
        )}

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            User saved.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to save user.
          </p>
        )}

        {deleteStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to remove user.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <TableHeader>User</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Added</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {detail.data.organizationUserRoles.map((organizationUserRole) => {
              const user = usersById.get(organizationUserRole.userId);
              const role = rolesById.get(organizationUserRole.roleId);

              return (
                <tr key={organizationUserRole.id}>
                  <TableCell>{user?.name ?? "Unknown user"}</TableCell>
                  <TableCell>{user?.email ?? organizationUserRole.userId}</TableCell>
                  <TableCell>{role?.name ?? organizationUserRole.roleId}</TableCell>
                  <TableCell>{formatDate(organizationUserRole.createdAt)}</TableCell>
                  <TableCell>
                    <button
                      className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                      disabled={deleteStatus === "deleting"}
                      type="button"
                      onClick={() => onRemove(organizationUserRole)}
                    >
                      Remove
                    </button>
                  </TableCell>
                </tr>
              );
            })}
            {detail.data.organizationUserRoles.length === 0 && (
              <tr>
                <TableCell>No users added.</TableCell>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

function PageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">{title}</h1>
      </header>
      {children}
    </>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-[18px] py-3.5 text-left text-xs font-bold uppercase text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-slate-100 px-[18px] py-3.5 text-left">{children}</td>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}
