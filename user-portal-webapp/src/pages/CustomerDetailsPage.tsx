import { Effect } from "effect";
import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import { addWorkOrderToCustomer, getCustomerDetails, setWorkOrderStatus } from "../services/userData";
import type { PortalOutletContext } from "../ui/RootLayout";

const workOrderStatuses = ["open", "in_progress", "completed", "cancelled"];

export function CustomerDetailsPage() {
  const { customerId = "" } = useParams();
  const { selectedOrganizationId } = useOutletContext<PortalOutletContext>();
  const navigate = useNavigate();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusUpdateStatus, setStatusUpdateStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [updatingWorkOrderId, setUpdatingWorkOrderId] = useState<string | undefined>();
  const [workOrderStatusEdits, setWorkOrderStatusEdits] = useState<Record<string, string>>({});
  const [createdWorkOrderNumber, setCreatedWorkOrderNumber] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const detailsProgram = useMemo(
    () => getCustomerDetails(customerId, selectedOrganizationId),
    [customerId, selectedOrganizationId, reloadKey]
  );
  const details = useEffectQuery(detailsProgram);
  const canCreateWorkOrder = selectedOrganizationId !== "" && submitStatus !== "submitting";

  const onCreateWorkOrder = () => {
    if (!canCreateWorkOrder) {
      return;
    }

    const workOrderNumber = generateWorkOrderNumber();
    setSubmitStatus("submitting");

    void Effect.runPromise(
      addWorkOrderToCustomer({
        customerId,
        workOrder: {
          organizationId: selectedOrganizationId,
          number: workOrderNumber,
          title: `Work order ${workOrderNumber}`,
          description: "",
          status: "open"
        }
      })
    ).then(
      (result) => {
        setCreatedWorkOrderNumber(workOrderNumber);
        setReloadKey((current) => current + 1);
        setSubmitStatus("success");
        navigate(`/work-orders/${result.workOrder.id}`);
      },
      () => {
        setSubmitStatus("error");
      }
    );
  };

  const onSetWorkOrderStatus = (workOrderId: string, nextStatus: string, currentStatus: string) => {
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

  if (details.status === "loading") {
    return <PageFrame title="Customer">Loading...</PageFrame>;
  }

  if (details.status === "error") {
    return <PageFrame title="Customer">Unable to load customer.</PageFrame>;
  }

  const { customer, workOrders } = details.data;

  return (
    <>
      <header className="mb-[22px] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm font-bold text-cyan-800 no-underline hover:text-slate-900" to="/customers">
            Customers
          </Link>
          <h1 className="m-0 mt-2 text-3xl font-bold tracking-normal">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="m-0 mt-2 text-sm text-slate-500">
            {customer.email || "No email"} - {customer.phone || "No phone"}
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <button
          className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={!canCreateWorkOrder}
          type="button"
          onClick={onCreateWorkOrder}
        >
          {submitStatus === "submitting" ? "Creating..." : "Create work order"}
        </button>

        {submitStatus === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Work order {createdWorkOrderNumber} created.
          </p>
        )}

        {submitStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to add work order.
          </p>
        )}

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

      <section className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {workOrders.length === 0 && <p className="m-0 p-[18px]">No work orders.</p>}
        {workOrders.length > 0 && (
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Number</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created</TableHeader>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((workOrder) => {
                const selectedStatus = workOrderStatusEdits[workOrder.id] ?? workOrder.status;
                const isUpdating =
                  statusUpdateStatus === "submitting" && updatingWorkOrderId === workOrder.id;

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
                    <TableCell>{workOrder.title}</TableCell>
                    <TableCell>
                      <select
                        className="min-h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                        disabled={statusUpdateStatus === "submitting"}
                        value={selectedStatus}
                        onChange={(event) =>
                          onSetWorkOrderStatus(workOrder.id, event.target.value, workOrder.status)
                        }
                      >
                        {workOrderStatuses.map((item) => (
                          <option key={item} value={item}>
                            {formatStatus(item)}
                          </option>
                        ))}
                      </select>
                      {isUpdating && <span className="ml-2 text-xs font-bold text-slate-500">Saving...</span>}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function generateWorkOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `WO-${datePart}-${randomPart}`;
}
