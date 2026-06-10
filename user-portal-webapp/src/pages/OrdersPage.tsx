import { Effect } from "effect";
import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import {
  getWorkOrdersForOrganization,
  setWorkOrderStatus,
  type WorkOrderSummary
} from "../services/userData";
import type { PortalOutletContext } from "../ui/RootLayout";

const workOrderStatuses = ["open", "in_progress", "completed", "cancelled"];

export function OrdersPage() {
  const { selectedOrganizationId } = useOutletContext<PortalOutletContext>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [statusUpdateStatus, setStatusUpdateStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [updatingWorkOrderId, setUpdatingWorkOrderId] = useState<
    string | undefined
  >();
  const [workOrderStatusEdits, setWorkOrderStatusEdits] = useState<
    Record<string, string>
  >({});
  const workOrdersProgram = useMemo(
    () => getWorkOrdersForOrganization(selectedOrganizationId),
    [selectedOrganizationId, reloadKey]
  );
  const workOrders = useEffectQuery(workOrdersProgram);
  const filteredWorkOrders =
    workOrders.status === "success"
      ? filterWorkOrders(workOrders.data, query, statusFilter)
      : [];

  const onSetWorkOrderStatus = (
    workOrderId: string,
    nextStatus: string,
    currentStatus: string
  ) => {
    setWorkOrderStatusEdits((current) => ({
      ...current,
      [workOrderId]: nextStatus
    }));
    setStatusUpdateStatus("submitting");
    setUpdatingWorkOrderId(workOrderId);

    void Effect.runPromise(
      setWorkOrderStatus({
        workOrderId,
        status: nextStatus
      })
    ).then(
      () => {
        setReloadKey((current) => current + 1);
        setStatusUpdateStatus("success");
        setUpdatingWorkOrderId(undefined);
      },
      () => {
        setWorkOrderStatusEdits((current) => ({
          ...current,
          [workOrderId]: currentStatus
        }));
        setStatusUpdateStatus("error");
        setUpdatingWorkOrderId(undefined);
      }
    );
  };

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Work orders</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Search
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              placeholder="Number, title, customer, status"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Status
            <select
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {workOrderStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {statusUpdateStatus === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Status updated.
          </p>
        )}

        {statusUpdateStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to update status.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {workOrders.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {workOrders.status === "error" && (
          <p className="m-0 p-[18px]">Unable to load work orders.</p>
        )}
        {workOrders.status === "success" && filteredWorkOrders.length === 0 && (
          <p className="m-0 p-[18px]">No work orders.</p>
        )}
        {workOrders.status === "success" && filteredWorkOrders.length > 0 && (
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Number</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created</TableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredWorkOrders.map((workOrder) => {
                const selectedStatus =
                  workOrderStatusEdits[workOrder.id] ?? workOrder.status;
                const isUpdating =
                  statusUpdateStatus === "submitting" &&
                  updatingWorkOrderId === workOrder.id;

                return (
                  <tr key={workOrder.id}>
                    <TableCell>
                      <Link
                        className="font-bold text-cyan-800 no-underline hover:text-slate-900"
                        to={`/work-orders/${workOrder.id}`}
                      >
                        {workOrder.number}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCustomerName(workOrder.customer)}</TableCell>
                    <TableCell>{workOrder.title}</TableCell>
                    <TableCell>
                      <select
                        className="min-h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                        disabled={statusUpdateStatus === "submitting"}
                        value={selectedStatus}
                        onChange={(event) =>
                          onSetWorkOrderStatus(
                            workOrder.id,
                            event.target.value,
                            workOrder.status
                          )
                        }
                      >
                        {workOrderStatuses.map((item) => (
                          <option key={item} value={item}>
                            {formatStatus(item)}
                          </option>
                        ))}
                      </select>
                      {isUpdating && (
                        <span className="ml-2 text-xs font-bold text-slate-500">
                          Saving...
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(workOrder.createdAt)}</TableCell>
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

function filterWorkOrders(
  workOrders: ReadonlyArray<WorkOrderSummary>,
  query: string,
  statusFilter: string
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === "" && statusFilter === "") {
    return workOrders;
  }

  return workOrders.filter((workOrder) => {
    const matchesStatus =
      statusFilter === "" || workOrder.status === statusFilter;
    const matchesQuery =
      normalizedQuery === "" ||
      [
        workOrder.number,
        workOrder.title,
        workOrder.status,
        workOrder.customer?.firstName,
        workOrder.customer?.lastName,
        workOrder.customer?.email
      ]
        .filter((value): value is string => value !== undefined)
        .some((value) => value.toLowerCase().includes(normalizedQuery));

    return matchesStatus && matchesQuery;
  });
}

function formatCustomerName(
  customer: { firstName: string; lastName: string } | undefined
) {
  if (customer === undefined) {
    return "-";
  }

  return `${customer.firstName} ${customer.lastName}`;
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
