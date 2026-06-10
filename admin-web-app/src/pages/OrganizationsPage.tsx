import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import { createOrganization, getOrganizations } from "../services/adminData";

export function OrganizationsPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const organizationsProgram = useMemo(() => getOrganizations(), [reloadKey]);
  const organizations = useEffectQuery(organizationsProgram);
  const normalizedCode = normalizeCode(code || name);
  const isFormValid = name.trim() !== "" && normalizedCode !== "";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    void Effect.runPromise(
      createOrganization({
        name: name.trim(),
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
        <h1 className="m-0 text-3xl font-bold tracking-normal">Organizations</h1>
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
              placeholder={normalizeCode(name) || "ACME"}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>

          <button
            className="min-h-11 self-end rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={status === "submitting" || !isFormValid}
            type="submit"
          >
            {status === "submitting" ? "Creating..." : "Create organization"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Organization created.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to create organization.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {organizations.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {organizations.status === "error" && (
          <p className="m-0 p-[18px]">Unable to load organizations.</p>
        )}
        {organizations.status === "success" && (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Code</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {organizations.data.map((organization) => (
                <tr key={organization.id}>
                  <TableCell>{organization.name}</TableCell>
                  <TableCell>{organization.code}</TableCell>
                  <TableCell>{formatDate(organization.createdAt)}</TableCell>
                  <TableCell>
                    <Link
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 no-underline transition-colors hover:bg-slate-100"
                      to={`/organizations/${organization.id}`}
                    >
                      Open
                    </Link>
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

function normalizeCode(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}
