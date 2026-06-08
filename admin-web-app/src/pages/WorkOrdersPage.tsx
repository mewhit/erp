import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import {
  createWorkOrder,
  Customer,
  deleteWorkOrder,
  getCustomers,
  getOrganizationOptions,
  getWorkOrders,
  updateWorkOrder,
  WorkOrder
} from "../services/adminData";

const statuses = ["open", "in_progress", "completed", "cancelled"];

export function WorkOrdersPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusValue, setStatusValue] = useState("open");
  const [editingWorkOrderId, setEditingWorkOrderId] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");
  const workOrders = useEffectQuery(useMemo(() => getWorkOrders(), [reloadKey]));
  const organizations = useEffectQuery(useMemo(() => getOrganizationOptions(), [reloadKey]));
  const customers = useEffectQuery(useMemo(() => getCustomers(), [reloadKey]));
  const organizationNames = new Map(
    organizations.status === "success"
      ? organizations.data.map((organization) => [organization.id, organization.name])
      : []
  );
  const customerNames = new Map(
    customers.status === "success"
      ? customers.data.map((customer) => [customer.id, formatCustomerName(customer)])
      : []
  );
  const isFormValid =
    organizationId !== "" && customerId !== "" && number.trim() !== "" && title.trim() !== "";

  const resetForm = () => {
    setOrganizationId("");
    setCustomerId("");
    setNumber("");
    setTitle("");
    setDescription("");
    setStatusValue("open");
    setEditingWorkOrderId(undefined);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const input = {
      organizationId,
      customerId,
      number: number.trim(),
      title: title.trim(),
      description: description.trim(),
      status: statusValue
    };

    const program =
      editingWorkOrderId === undefined
        ? createWorkOrder(input)
        : updateWorkOrder(editingWorkOrderId, input);

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

  const onEdit = (workOrder: WorkOrder) => {
    setOrganizationId(workOrder.organizationId);
    setCustomerId(workOrder.customerId);
    setNumber(workOrder.number);
    setTitle(workOrder.title);
    setDescription(workOrder.description);
    setStatusValue(workOrder.status);
    setEditingWorkOrderId(workOrder.id);
    setStatus("idle");
  };

  const onDelete = (workOrder: WorkOrder) => {
    if (!window.confirm(`Delete work order ${workOrder.number}?`)) {
      return;
    }

    setDeleteStatus("deleting");

    void Effect.runPromise(deleteWorkOrder(workOrder.id)).then(
      () => {
        if (editingWorkOrderId === workOrder.id) {
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
        <h1 className="m-0 text-3xl font-bold tracking-normal">Work Orders</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_150px_150px]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Organization
            <select className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" required value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
              <option value="">Select organization</option>
              {organizations.status === "success" &&
                organizations.data.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
            </select>
          </label>

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
            Number
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" required value={number} onChange={(event) => setNumber(event.target.value)} />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Status
            <select className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600 lg:col-span-2">
            Title
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600 lg:col-span-2">
            Description
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <div className="flex flex-wrap gap-2 self-end lg:col-span-4">
            <button className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={status === "submitting" || !isFormValid} type="submit">
              {status === "submitting" ? "Saving..." : editingWorkOrderId === undefined ? "Create work order" : "Update work order"}
            </button>
            {editingWorkOrderId !== undefined && (
              <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {status === "success" && <Message tone="success">Work order saved.</Message>}
        {status === "error" && <Message tone="error">Unable to save work order.</Message>}
        {deleteStatus === "error" && <Message tone="error">Unable to delete work order.</Message>}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {workOrders.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {workOrders.status === "error" && <p className="m-0 p-[18px]">Unable to load work orders.</p>}
        {workOrders.status === "success" && (
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Number</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Organization</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {workOrders.data.map((workOrder) => (
                <tr key={workOrder.id}>
                  <TableCell>{workOrder.number}</TableCell>
                  <TableCell>{workOrder.title}</TableCell>
                  <TableCell>{organizationNames.get(workOrder.organizationId) ?? workOrder.organizationId}</TableCell>
                  <TableCell>{customerNames.get(workOrder.customerId) ?? workOrder.customerId}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(workOrder.status)}>{formatStatus(workOrder.status)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100" type="button" onClick={() => onEdit(workOrder)}>
                        Edit
                      </button>
                      <button className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300" disabled={deleteStatus === "deleting"} type="button" onClick={() => onDelete(workOrder)}>
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

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function getStatusClassName(value: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize";

  if (value === "completed") {
    return `${base} bg-emerald-100 text-emerald-800`;
  }

  if (value === "cancelled") {
    return `${base} bg-slate-200 text-slate-600`;
  }

  if (value === "in_progress") {
    return `${base} bg-amber-100 text-amber-800`;
  }

  return `${base} bg-cyan-100 text-cyan-800`;
}
