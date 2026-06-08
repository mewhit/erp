import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import {
  createOrganizationCustomer,
  deleteOrganizationCustomer,
  getCustomers,
  getOrganizationCustomers,
  getOrganizationOptions,
  OrganizationCustomer,
  updateOrganizationCustomer
} from "../services/adminData";

export function OrganizationCustomersPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [editingOrganizationCustomerId, setEditingOrganizationCustomerId] =
    useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");
  const organizationCustomersProgram = useMemo(() => getOrganizationCustomers(), [reloadKey]);
  const organizationsProgram = useMemo(() => getOrganizationOptions(), [reloadKey]);
  const customersProgram = useMemo(() => getCustomers(), [reloadKey]);
  const organizationCustomers = useEffectQuery(organizationCustomersProgram);
  const organizations = useEffectQuery(organizationsProgram);
  const customers = useEffectQuery(customersProgram);
  const isFormValid = organizationId !== "" && customerId !== "";
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

  const resetForm = () => {
    setOrganizationId("");
    setCustomerId("");
    setEditingOrganizationCustomerId(undefined);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const input = {
      organizationId,
      customerId
    };

    const program =
      editingOrganizationCustomerId === undefined
        ? createOrganizationCustomer(input)
        : updateOrganizationCustomer(editingOrganizationCustomerId, input);

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

  const onEdit = (organizationCustomer: OrganizationCustomer) => {
    setOrganizationId(organizationCustomer.organizationId);
    setCustomerId(organizationCustomer.customerId);
    setEditingOrganizationCustomerId(organizationCustomer.id);
    setStatus("idle");
  };

  const onDelete = (organizationCustomer: OrganizationCustomer) => {
    const organizationName = organizationNames.get(organizationCustomer.organizationId) ?? organizationCustomer.organizationId;
    const customerName = customerNames.get(organizationCustomer.customerId) ?? organizationCustomer.customerId;

    if (!window.confirm(`Remove ${customerName} from ${organizationName}?`)) {
      return;
    }

    setDeleteStatus("deleting");

    void Effect.runPromise(deleteOrganizationCustomer(organizationCustomer.id)).then(
      () => {
        if (editingOrganizationCustomerId === organizationCustomer.id) {
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
        <h1 className="m-0 text-3xl font-bold tracking-normal">Organization Customers</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Organization
            <select
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
            >
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
            <select
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Select customer</option>
              {customers.status === "success" &&
                customers.data.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {formatCustomerName(customer)}
                  </option>
                ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 self-end">
            <button
              className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={status === "submitting" || !isFormValid}
              type="submit"
            >
              {status === "submitting" ? "Saving..." : editingOrganizationCustomerId === undefined ? "Create link" : "Update link"}
            </button>

            {editingOrganizationCustomerId !== undefined && (
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
            Organization customer saved.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to save organization customer.
          </p>
        )}

        {deleteStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to delete organization customer.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {organizationCustomers.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {organizationCustomers.status === "error" && (
          <p className="m-0 p-[18px]">Unable to load organization customers.</p>
        )}
        {organizationCustomers.status === "success" && (
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Organization</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {organizationCustomers.data.map((organizationCustomer) => (
                <tr key={organizationCustomer.id}>
                  <TableCell>
                    {organizationNames.get(organizationCustomer.organizationId) ?? organizationCustomer.organizationId}
                  </TableCell>
                  <TableCell>
                    {customerNames.get(organizationCustomer.customerId) ?? organizationCustomer.customerId}
                  </TableCell>
                  <TableCell>{formatDate(organizationCustomer.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        type="button"
                        onClick={() => onEdit(organizationCustomer)}
                      >
                        Edit
                      </button>
                      <button
                        className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                        disabled={deleteStatus === "deleting"}
                        type="button"
                        onClick={() => onDelete(organizationCustomer)}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatCustomerName(customer: { firstName: string; lastName: string }) {
  return `${customer.firstName} ${customer.lastName}`.trim();
}
