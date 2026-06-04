import { useEffectQuery } from "../hooks";
import { getOrganizations } from "../services/adminData";

export function OrganizationsPage() {
  const organizations = useEffectQuery(getOrganizations);

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Organizations</h1>
      </header>
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
                <TableHeader>Status</TableHeader>
                <TableHeader>Seats</TableHeader>
              </tr>
            </thead>
            <tbody>
              {organizations.data.map((organization) => (
                <tr key={organization.id}>
                  <TableCell>{organization.name}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(organization.status)}>
                      {organization.status}
                    </span>
                  </TableCell>
                  <TableCell>{organization.seats}</TableCell>
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

function getStatusClassName(status: "active" | "pending" | "archived") {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize";

  if (status === "active") {
    return `${base} bg-emerald-100 text-emerald-800`;
  }

  if (status === "pending") {
    return `${base} bg-amber-100 text-amber-800`;
  }

  return `${base} bg-slate-200 text-slate-600`;
}
