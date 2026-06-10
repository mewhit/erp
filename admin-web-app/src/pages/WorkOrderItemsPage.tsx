import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import {
  createWorkOrderItem,
  deleteWorkOrderItem,
  getItems,
  getWorkOrderItems,
  getWorkOrders,
  Item,
  updateWorkOrderItem,
  WorkOrderItem
} from "../services/adminData";

export function WorkOrderItemsPage() {
  const [workOrderId, setWorkOrderId] = useState("");
  const [itemId, setItemId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0.00");
  const [editingWorkOrderItemId, setEditingWorkOrderItemId] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");
  const workOrderItems = useEffectQuery(useMemo(() => getWorkOrderItems(), [reloadKey]));
  const workOrders = useEffectQuery(useMemo(() => getWorkOrders(), [reloadKey]));
  const items = useEffectQuery(useMemo(() => getItems(), [reloadKey]));
  const workOrderNumbers = new Map(
    workOrders.status === "success"
      ? workOrders.data.map((workOrder) => [workOrder.id, workOrder.number])
      : []
  );
  const itemNames = new Map(
    items.status === "success" ? items.data.map((item) => [item.id, item.name]) : []
  );
  const parsedQuantity = Number.parseInt(quantity, 10);
  const parsedUnitPriceCents = parsePriceCents(unitPrice);
  const isFormValid =
    workOrderId !== "" &&
    itemId !== "" &&
    Number.isInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    Number.isFinite(parsedUnitPriceCents) &&
    parsedUnitPriceCents >= 0;

  const resetForm = () => {
    setWorkOrderId("");
    setItemId("");
    setDescription("");
    setQuantity("1");
    setUnitPrice("0.00");
    setEditingWorkOrderItemId(undefined);
  };

  const onItemChange = (nextItemId: string) => {
    setItemId(nextItemId);
    const selectedItem = items.status === "success" ? items.data.find((item) => item.id === nextItemId) : undefined;

    if (selectedItem !== undefined) {
      setDescription(selectedItem.description);
      setUnitPrice(formatPriceInput(selectedItem.unitPriceCents));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const input = {
      workOrderId,
      itemId,
      description: description.trim(),
      quantity: parsedQuantity,
      unitPriceCents: parsedUnitPriceCents
    };

    const program =
      editingWorkOrderItemId === undefined
        ? createWorkOrderItem(input)
        : updateWorkOrderItem(editingWorkOrderItemId, input);

    void Effect.runPromise(program).then(
      () => {
        resetForm();
        setStatus("success");
        setReloadKey((current) => current + 1);
      },
      () => {
        setStatus("error");
      }
    );
  };

  const onEdit = (workOrderItem: WorkOrderItem) => {
    setWorkOrderId(workOrderItem.workOrderId);
    setItemId(workOrderItem.itemId);
    setDescription(workOrderItem.description);
    setQuantity(String(workOrderItem.quantity));
    setUnitPrice(formatPriceInput(workOrderItem.unitPriceCents));
    setEditingWorkOrderItemId(workOrderItem.id);
    setStatus("idle");
  };

  const onDelete = (workOrderItem: WorkOrderItem) => {
    const workOrderNumber = workOrderNumbers.get(workOrderItem.workOrderId) ?? workOrderItem.workOrderId;

    if (!window.confirm(`Delete item from work order ${workOrderNumber}?`)) {
      return;
    }

    setDeleteStatus("deleting");

    void Effect.runPromise(deleteWorkOrderItem(workOrderItem.id)).then(
      () => {
        if (editingWorkOrderItemId === workOrderItem.id) {
          resetForm();
        }

        setDeleteStatus("idle");
        setReloadKey((current) => current + 1);
      },
      () => {
        setDeleteStatus("error");
      }
    );
  };

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Work Order Items</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_120px_140px]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Work order
            <select className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" required value={workOrderId} onChange={(event) => setWorkOrderId(event.target.value)}>
              <option value="">Select work order</option>
              {workOrders.status === "success" &&
                workOrders.data.map((workOrder) => (
                  <option key={workOrder.id} value={workOrder.id}>
                    {workOrder.number}
                  </option>
                ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Item
            <select className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" required value={itemId} onChange={(event) => onItemChange(event.target.value)}>
              <option value="">Select item</option>
              {items.status === "success" &&
                items.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatItemName(item)}
                  </option>
                ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Quantity
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" min="1" step="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Unit price
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" min="0" step="0.01" type="number" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600 xl:col-span-4">
            Description
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <div className="flex flex-wrap gap-2 self-end xl:col-span-4">
            <button className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={status === "submitting" || !isFormValid} type="submit">
              {status === "submitting" ? "Saving..." : editingWorkOrderItemId === undefined ? "Create work order item" : "Update work order item"}
            </button>
            {editingWorkOrderItemId !== undefined && (
              <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {status === "success" && <Message tone="success">Work order item saved.</Message>}
        {status === "error" && <Message tone="error">Unable to save work order item.</Message>}
        {deleteStatus === "error" && <Message tone="error">Unable to delete work order item.</Message>}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {workOrderItems.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {workOrderItems.status === "error" && <p className="m-0 p-[18px]">Unable to load work order items.</p>}
        {workOrderItems.status === "success" && (
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Work order</TableHeader>
                <TableHeader>Item</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Unit price</TableHeader>
                <TableHeader>Total</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {workOrderItems.data.map((workOrderItem) => (
                <tr key={workOrderItem.id}>
                  <TableCell>{workOrderNumbers.get(workOrderItem.workOrderId) ?? workOrderItem.workOrderId}</TableCell>
                  <TableCell>{itemNames.get(workOrderItem.itemId) ?? workOrderItem.itemId}</TableCell>
                  <TableCell>{workOrderItem.description}</TableCell>
                  <TableCell>{workOrderItem.quantity}</TableCell>
                  <TableCell>{formatPrice(workOrderItem.unitPriceCents)}</TableCell>
                  <TableCell>{formatPrice(workOrderItem.unitPriceCents * workOrderItem.quantity)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={() => onEdit(workOrderItem)}>
                        Edit
                      </button>
                      <button className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300" disabled={deleteStatus === "deleting"} type="button" onClick={() => onDelete(workOrderItem)}>
                        Delete
                      </button>
                    </div>
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
  return <th className="border-b border-slate-200 px-[18px] py-3.5 text-left text-xs font-bold uppercase text-slate-500">{children}</th>;
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-slate-100 px-[18px] py-3.5 text-left">{children}</td>;
}

function Message({ children, tone }: { children: React.ReactNode; tone: "success" | "error" }) {
  const className =
    tone === "success"
      ? "mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800"
      : "mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800";
  return <p className={className}>{children}</p>;
}

function formatItemName(item: Item) {
  return `${item.name} (${item.sku})`;
}

function parsePriceCents(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

function formatPriceInput(unitPriceCents: number) {
  return (unitPriceCents / 100).toFixed(2);
}

function formatPrice(unitPriceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(unitPriceCents / 100);
}
