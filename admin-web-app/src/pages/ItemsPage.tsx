import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import { createItem, deleteItem, getItems, Item, updateItem } from "../services/adminData";

export function ItemsPage() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("0.00");
  const [quantity, setQuantity] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");
  const itemsProgram = useMemo(() => getItems(), [reloadKey]);
  const items = useEffectQuery(itemsProgram);
  const normalizedSku = normalizeSku(sku || name);
  const parsedQuantity = Number.parseInt(quantity, 10);
  const parsedUnitPriceCents = parsePriceCents(unitPrice);
  const isFormValid =
    name.trim() !== "" &&
    normalizedSku !== "" &&
    Number.isFinite(parsedUnitPriceCents) &&
    parsedUnitPriceCents >= 0 &&
    Number.isInteger(parsedQuantity) &&
    parsedQuantity >= 0;

  const resetForm = () => {
    setName("");
    setSku("");
    setDescription("");
    setUnitPrice("0.00");
    setQuantity("0");
    setIsActive(true);
    setEditingItemId(undefined);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const input = {
      name: name.trim(),
      sku: normalizedSku,
      description: description.trim(),
      unitPriceCents: parsedUnitPriceCents,
      quantity: parsedQuantity
    };

    const program =
      editingItemId === undefined
        ? createItem(input)
        : updateItem(editingItemId, {
            ...input,
            isActive
          });

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

  const onEdit = (item: Item) => {
    setName(item.name);
    setSku(item.sku);
    setDescription(item.description);
    setUnitPrice(formatPriceInput(item.unitPriceCents));
    setQuantity(String(item.quantity));
    setIsActive(item.isActive);
    setEditingItemId(item.id);
    setStatus("idle");
  };

  const onDelete = (item: Item) => {
    if (!window.confirm(`Delete item ${item.name}?`)) {
      return;
    }

    setDeleteStatus("deleting");

    void Effect.runPromise(deleteItem(item.id)).then(
      () => {
        if (editingItemId === item.id) {
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
        <h1 className="m-0 text-3xl font-bold tracking-normal">Items</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 xl:grid-cols-[minmax(180px,1fr)_160px_130px_110px_auto]" onSubmit={onSubmit}>
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
            SKU
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal uppercase text-slate-900 outline-none transition-colors focus:border-cyan-800"
              placeholder={normalizeSku(name) || "ITEM_001"}
              value={sku}
              onChange={(event) => setSku(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Price
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              min="0"
              step="0.01"
              type="number"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Quantity
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              min="0"
              step="1"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <label className="flex min-h-11 items-center gap-2 self-end text-sm font-bold text-slate-600">
            <input
              checked={isActive}
              className="size-4 accent-cyan-800"
              type="checkbox"
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600 xl:col-span-4">
            Description
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2 self-end">
            <button
              className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={status === "submitting" || !isFormValid}
              type="submit"
            >
              {status === "submitting" ? "Saving..." : editingItemId === undefined ? "Create item" : "Update item"}
            </button>

            {editingItemId !== undefined && (
              <button
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-600 transition-colors hover:bg-slate-100"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Item saved.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to save item.
          </p>
        )}

        {deleteStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to delete item.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {items.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {items.status === "error" && <p className="m-0 p-[18px]">Unable to load items.</p>}
        {items.status === "success" && (
          <table className="w-full min-w-[780px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>SKU</TableHeader>
                <TableHeader>Price</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {items.data.map((item) => (
                <tr key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{formatPrice(item.unitPriceCents)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(item.isActive)}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        type="button"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                        disabled={deleteStatus === "deleting"}
                        type="button"
                        onClick={() => onDelete(item)}
                      >
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

function normalizeSku(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
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
