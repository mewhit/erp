import { useEffectQuery } from "../hooks";
import { getSupportTickets } from "../services/userData";

export function SupportPage() {
  const tickets = useEffectQuery(getSupportTickets);

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Support</h1>
      </header>
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {tickets.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {tickets.status === "error" && <p className="m-0 p-[18px]">Unable to load tickets.</p>}
        {tickets.status === "success" && (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Updated</TableHeader>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map((ticket) => (
                <tr key={ticket.id}>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(ticket.status)}>{ticket.status}</span>
                  </TableCell>
                  <TableCell>{ticket.updatedAt}</TableCell>
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

function getStatusClassName(status: "open" | "waiting" | "resolved") {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize";

  if (status === "open") {
    return `${base} bg-rose-100 text-rose-800`;
  }

  if (status === "waiting") {
    return `${base} bg-amber-100 text-amber-800`;
  }

  return `${base} bg-emerald-100 text-emerald-800`;
}
