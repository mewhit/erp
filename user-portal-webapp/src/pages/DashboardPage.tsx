import { useEffectQuery } from "../hooks";
import { getDashboardStats } from "../services/userData";

export function DashboardPage() {
  const stats = useEffectQuery(getDashboardStats);

  if (stats.status === "loading") {
    return <PageFrame title="Dashboard">Loading...</PageFrame>;
  }

  if (stats.status === "error") {
    return <PageFrame title="Dashboard">Unable to load dashboard.</PageFrame>;
  }

  return (
    <PageFrame title="Dashboard">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard metrics">
        <Metric label="Orders" value={stats.data.orders} />
        <Metric label="Active orders" value={stats.data.activeOrders} />
        <Metric label="Tickets" value={stats.data.tickets} />
        <Metric label="Open tickets" value={stats.data.openTickets} />
      </section>
    </PageFrame>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="grid min-h-32 gap-3 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="self-end text-3xl font-bold">{value}</strong>
    </article>
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
