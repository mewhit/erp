import { Effect } from "effect";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import {
  addWorkOrderItem,
  getWorkOrderDetails,
  setWorkOrderItemQuantity,
  setWorkOrderStatus
} from "../services/userData";
import type { PortalOutletContext } from "../ui/RootLayout";

const workOrderStatuses = ["open", "in_progress", "completed", "cancelled"];

export function WorkOrderDetailsPage() {
  const { workOrderId = "" } = useParams();
  const { selectedOrganizationId } = useOutletContext<PortalOutletContext>();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [workOrderStatusValue, setWorkOrderStatusValue] = useState("open");
  const [workOrderStatusUpdateStatus, setWorkOrderStatusUpdateStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [quantityStatus, setQuantityStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [updatingWorkOrderItemId, setUpdatingWorkOrderItemId] = useState<string | undefined>();
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>({});
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

    setWorkOrderStatusValue(details.data.workOrder.status);

    setItemId((currentItemId) => {
      if (details.data.items.length === 0) {
        return "";
      }

      return details.data.items.some((item) => item.id === currentItemId)
        ? currentItemId
        : details.data.items[0].id;
    });

    setQuantityEdits((currentQuantityEdits) => {
      const nextQuantityEdits: Record<string, string> = {};

      for (const workOrderItem of details.data.workOrderItems) {
        nextQuantityEdits[workOrderItem.id] =
          currentQuantityEdits[workOrderItem.id] ?? String(workOrderItem.quantity);
      }

      return nextQuantityEdits;
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

  const onSetWorkOrderStatus = (nextStatus: string) => {
    setWorkOrderStatusValue(nextStatus);
    setWorkOrderStatusUpdateStatus("submitting");

    void Effect.runPromise(
      setWorkOrderStatus({
        workOrderId,
        status: nextStatus
      })
    ).then(
      () => {
        setReloadKey((current) => current + 1);
        setWorkOrderStatusUpdateStatus("success");
      },
      () => {
        setWorkOrderStatusValue(workOrder.status);
        setWorkOrderStatusUpdateStatus("error");
      }
    );
  };

  const onSetItemQuantity = (workOrderItemId: string) => {
    const nextQuantity = Number(quantityEdits[workOrderItemId] ?? "");

    if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
      return;
    }

    setQuantityStatus("submitting");
    setUpdatingWorkOrderItemId(workOrderItemId);

    void Effect.runPromise(
      setWorkOrderItemQuantity({
        workOrderId,
        workOrderItemId,
        quantity: Math.trunc(nextQuantity)
      })
    ).then(
      () => {
        setReloadKey((current) => current + 1);
        setQuantityStatus("success");
        setUpdatingWorkOrderItemId(undefined);
      },
      () => {
        setQuantityStatus("error");
        setUpdatingWorkOrderItemId(undefined);
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
        <div className="mt-4 flex max-w-xs flex-col gap-2 text-sm font-bold text-slate-600">
          <label htmlFor="work-order-status">Status</label>
          <select
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={workOrderStatusUpdateStatus === "submitting"}
            id="work-order-status"
            value={workOrderStatusValue}
            onChange={(event) => onSetWorkOrderStatus(event.target.value)}
          >
            {workOrderStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>
        </div>
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

        {workOrderStatusUpdateStatus === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Status updated.
          </p>
        )}

        {workOrderStatusUpdateStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to update status.
          </p>
        )}

        {quantityStatus === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Quantity updated.
          </p>
        )}

        {quantityStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to update quantity.
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
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {workOrderItems.map((workOrderItem) => {
                const isUpdating =
                  quantityStatus === "submitting" && updatingWorkOrderItemId === workOrderItem.id;
                const editedQuantity = quantityEdits[workOrderItem.id] ?? String(workOrderItem.quantity);

                return (
                  <tr key={workOrderItem.id}>
                    <TableCell>{workOrderItem.item?.name ?? workOrderItem.description}</TableCell>
                    <TableCell>{workOrderItem.item?.sku ?? "-"}</TableCell>
                    <TableCell>
                      <input
                        className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-800"
                        min={0}
                        type="number"
                        value={editedQuantity}
                        onChange={(event) =>
                          setQuantityEdits((currentQuantityEdits) => ({
                            ...currentQuantityEdits,
                            [workOrderItem.id]: event.target.value
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                          disabled={quantityStatus === "submitting"}
                          type="button"
                          onClick={() => onSetItemQuantity(workOrderItem.id)}
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
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

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}
