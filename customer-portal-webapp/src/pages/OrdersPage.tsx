import { useEffectQuery } from "../hooks";
import { getOrders } from "../services/customerData";

export function OrdersPage() {
  const orders = useEffectQuery(getOrders);

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Orders</h1>
      </header>
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {orders.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {orders.status === "error" && <p className="m-0 p-[18px]">Unable to load orders.</p>}
        {orders.status === "success" && (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Order</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Total</TableHeader>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((order) => (
                <tr key={order.id}>
                  <TableCell>{order.number}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(order.status)}>{order.status}</span>
                  </TableCell>
                  <TableCell>${order.total.toLocaleString()}</TableCell>
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

function getStatusClassName(status: "processing" | "shipped" | "delivered") {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize";

  if (status === "processing") {
    return `${base} bg-amber-100 text-amber-800`;
  }

  if (status === "shipped") {
    return `${base} bg-cyan-100 text-cyan-800`;
  }

  return `${base} bg-emerald-100 text-emerald-800`;
}
