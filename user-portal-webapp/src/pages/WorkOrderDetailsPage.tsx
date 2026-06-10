import { Effect } from "effect";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import { addWorkOrderItem, getWorkOrderDetails } from "../services/userData";
import type { PortalOutletContext } from "../ui/RootLayout";

export function WorkOrderDetailsPage() {
  const { workOrderId = "" } = useParams();
  const { selectedOrganizationId } = useOutletContext<PortalOutletContext>();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [reloadKey, setReloadKey] = useState(0);
  const detailsProgram = useMemo(
    () => getWorkOrderDetails(workOrderId, selectedOrganizationId),
    [workOrderId, selectedOrganizationId, reloadKey]
  );
  const details = useEffectQuery(detailsProgram);
  const selectedItem =
    details.status === "success"
      ? details.data.items.find((item) => item.id === itemId)
      : undefined;
  const isFormValid = selectedItem !== undefined && quantity > 0;

  useEffect(() => {
    if (details.status !== "success") {
      return;
    }

    setItemId((currentItemId) => {
      if (details.data.items.length === 0) {
        return "";
      }

      return details.data.items.some((item) => item.id === currentItemId)
        ? currentItemId
        : details.data.items[0].id;
    });
  }, [details]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    void Effect.runPromise(
      addWorkOrderItem({
        workOrderId,
        itemId: selectedItem.id,
        description: selectedItem.description || selectedItem.name,
        quantity,
        unitPriceCents: selectedItem.unitPriceCents
      })
    ).then(
      () => {
        setQuantity(1);
        setReloadKey((current) => current + 1);
        setStatus("success");
      },
      () => {
        setStatus("error");
      }
    );
  };

  if (details.status === "loading") {
    return <PageFrame title="Work order">Loading...</PageFrame>;
  }

  if (details.status === "error") {
    return <PageFrame title="Work order">Unable to load work order.</PageFrame>;
  }

  const { customer, items, workOrder, workOrderItems } = details.data;
  const totalCents = workOrderItems.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0
  );

  return (
    <>
      <header className="mb-[22px]">
        <Link
          className="text-sm font-bold text-cyan-800 no-underline hover:text-slate-900"
          to={`/customers/${customer.id}`}
        >
          {customer.firstName} {customer.lastName}
        </Link>
        <h1 className="m-0 mt-2 text-3xl font-bold tracking-normal">{workOrder.number}</h1>
        <p className="m-0 mt-2 text-sm text-slate-500">
          {workOrder.title} - {workOrder.status}
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px_auto]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Item
            <select
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              disabled={items.length === 0}
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
            >
              {items.length === 0 && <option value="">No items available</option>}
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Quantity
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              min={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>

          <div className="flex items-end">
            <button
              className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={status === "submitting" || !isFormValid}
              type="submit"
            >
              {status === "submitting" ? "Adding..." : "Add item"}
            </button>
          </div>
        </form>

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Item added.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to add item.
          </p>
        )}
      </section>

      <section className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {workOrderItems.length === 0 && <p className="m-0 p-[18px]">No items.</p>}
        {workOrderItems.length > 0 && (
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Item</TableHeader>
                <TableHeader>SKU</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Unit price</TableHeader>
                <TableHeader>Total</TableHeader>
              </tr>
            </thead>
            <tbody>
              {workOrderItems.map((workOrderItem) => (
                <tr key={workOrderItem.id}>
                  <TableCell>{workOrderItem.item?.name ?? workOrderItem.description}</TableCell>
                  <TableCell>{workOrderItem.item?.sku ?? "-"}</TableCell>
                  <TableCell>{workOrderItem.quantity}</TableCell>
                  <TableCell>{formatMoney(workOrderItem.unitPriceCents)}</TableCell>
                  <TableCell>{formatMoney(workOrderItem.quantity * workOrderItem.unitPriceCents)}</TableCell>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-[18px] py-3.5 text-right font-bold" colSpan={4}>
                  Total
                </td>
                <td className="px-[18px] py-3.5 font-bold">{formatMoney(totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        )}
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency"
  }).format(value / 100);
}
