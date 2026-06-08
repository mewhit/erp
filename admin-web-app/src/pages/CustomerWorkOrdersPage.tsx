import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import {
  createCustomerWorkOrder,
  Customer,
  CustomerWorkOrder,
  deleteCustomerWorkOrder,
  getCustomers,
  getCustomerWorkOrders,
  getWorkOrders,
  updateCustomerWorkOrder
} from "../services/adminData";

export function CustomerWorkOrdersPage() {
  const [customerId, setCustomerId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [editingCustomerWorkOrderId, setEditingCustomerWorkOrderId] =
    useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");
  const customerWorkOrders = useEffectQuery(
    useMemo(() => getCustomerWorkOrders(), [reloadKey])
  );
  const customers = useEffectQuery(useMemo(() => getCustomers(), [reloadKey]));
  const workOrders = useEffectQuery(useMemo(() => getWorkOrders(), [reloadKey]));
  const customerNames = new Map(
    customers.status === "success"
      ? customers.data.map((customer) => [customer.id, formatCustomerName(customer)])
      : []
  );
  const workOrderNumbers = new Map(
    workOrders.status === "success"
      ? workOrders.data.map((workOrder) => [workOrder.id, workOrder.number])
      : []
  );
  const isFormValid = customerId !== "" && workOrderId !== "";

  const resetForm = () => {
    setCustomerId("");
    setWorkOrderId("");
    setEditingCustomerWorkOrderId(undefined);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const input = {
      customerId,
      workOrderId
    };

    const program =
      editingCustomerWorkOrderId === undefined
        ? createCustomerWorkOrder(input)
        : updateCustomerWorkOrder(editingCustomerWorkOrderId, input);

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

  const onEdit = (customerWorkOrder: CustomerWorkOrder) => {
    setCustomerId(customerWorkOrder.customerId);
    setWorkOrderId(customerWorkOrder.workOrderId);
    setEditingCustomerWorkOrderId(customerWorkOrder.id);
    setStatus("idle");
  };

  const onDelete = (customerWorkOrder: CustomerWorkOrder) => {
    const customerName =
      customerNames.get(customerWorkOrder.customerId) ?? customerWorkOrder.customerId;
    const workOrderNumber =
      workOrderNumbers.get(customerWorkOrder.workOrderId) ??
      customerWorkOrder.workOrderId;

    if (!window.confirm(`Remove ${customerName} from work order ${workOrderNumber}?`)) {
      return;
    }

    setDeleteStatus("deleting");

    void Effect.runPromise(deleteCustomerWorkOrder(customerWorkOrder.id)).then(
      () => {
        if (editingCustomerWorkOrderId === customerWorkOrder.id) {
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
        <h1 className="m-0 text-3xl font-bold tracking-normal">Customer Work Orders</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Customer
            <select className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" required value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Select customer</option>
              {customers.status === "success" &&
                customers.data.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {formatCustomerName(customer)}
                  </option>
                ))}
            </select>
          </label>

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

          <div className="flex flex-wrap gap-2 self-end">
            <button className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={status === "submitting" || !isFormValid} type="submit">
              {status === "submitting" ? "Saving..." : editingCustomerWorkOrderId === undefined ? "Create link" : "Update link"}
            </button>
            {editingCustomerWorkOrderId !== undefined && (
              <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {status === "success" && <Message tone="success">Customer work order saved.</Message>}
        {status === "error" && <Message tone="error">Unable to save customer work order.</Message>}
        {deleteStatus === "error" && <Message tone="error">Unable to delete customer work order.</Message>}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {customerWorkOrders.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {customerWorkOrders.status === "error" && (
          <p className="m-0 p-[18px]">Unable to load customer work orders.</p>
        )}
        {customerWorkOrders.status === "success" && (
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Work order</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {customerWorkOrders.data.map((customerWorkOrder) => (
                <tr key={customerWorkOrder.id}>
                  <TableCell>
                    {customerNames.get(customerWorkOrder.customerId) ?? customerWorkOrder.customerId}
                  </TableCell>
                  <TableCell>
                    {workOrderNumbers.get(customerWorkOrder.workOrderId) ?? customerWorkOrder.workOrderId}
                  </TableCell>
                  <TableCell>{formatDate(customerWorkOrder.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={() => onEdit(customerWorkOrder)}>
                        Edit
                      </button>
                      <button className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300" disabled={deleteStatus === "deleting"} type="button" onClick={() => onDelete(customerWorkOrder)}>
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

function formatCustomerName(customer: Customer) {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
