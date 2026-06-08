import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import { createRole, getRoles } from "../services/adminData";

export function RolesPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const rolesProgram = useMemo(() => getRoles(), [reloadKey]);
  const roles = useEffectQuery(rolesProgram);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const trimmedName = name.trim();
    const normalizedCode = normalizeCode(code || name);

    void Effect.runPromise(
      createRole({
        name: trimmedName,
        code: normalizedCode
      })
    ).then(
      () => {
        setName("");
        setCode("");
        setStatus("success");
        setReloadKey((current) => current + 1);
      },
      () => {
        setStatus("error");
      }
    );
  };

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Roles</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Name
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Code
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal uppercase text-slate-900 outline-none transition-colors focus:border-cyan-800"
              placeholder={normalizeCode(name) || "ADMIN"}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>

          <button
            className="min-h-11 self-end rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={status === "submitting" || name.trim() === ""}
            type="submit"
          >
            {status === "submitting" ? "Creating..." : "Create role"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Role created.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to create role.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {roles.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {roles.status === "error" && <p className="m-0 p-[18px]">Unable to load roles.</p>}
        {roles.status === "success" && (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Code</TableHeader>
                <TableHeader>Status</TableHeader>
              </tr>
            </thead>
            <tbody>
              {roles.data.map((role) => (
                <tr key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.code}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(role.isActive)}>
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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

function getStatusClassName(isActive: boolean) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold";
  return isActive ? `${base} bg-emerald-100 text-emerald-800` : `${base} bg-slate-200 text-slate-600`;
}

function normalizeCode(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}
