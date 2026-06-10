import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import {
  createCustomer,
  Customer,
  deleteCustomer,
  getCustomers,
  updateCustomer
} from "../services/adminData";

export function CustomersPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingCustomerId, setEditingCustomerId] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle");
  const customersProgram = useMemo(() => getCustomers(), [reloadKey]);
  const customers = useEffectQuery(customersProgram);
  const normalizedEmail = email.trim().toLowerCase();
  const isFormValid =
    firstName.trim() !== "" && lastName.trim() !== "" && normalizedEmail !== "";

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setIsActive(true);
    setEditingCustomerId(undefined);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const input = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim()
    };

    const program =
      editingCustomerId === undefined
        ? createCustomer(input)
        : updateCustomer(editingCustomerId, {
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

  const onEdit = (customer: Customer) => {
    setFirstName(customer.firstName);
    setLastName(customer.lastName);
    setEmail(customer.email);
    setPhone(customer.phone);
    setIsActive(customer.isActive);
    setEditingCustomerId(customer.id);
    setStatus("idle");
  };

  const onDelete = (customer: Customer) => {
    if (!window.confirm(`Delete customer ${formatCustomerName(customer)}?`)) {
      return;
    }

    setDeleteStatus("deleting");

    void Effect.runPromise(deleteCustomer(customer.id)).then(
      () => {
        if (editingCustomerId === customer.id) {
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
        <h1 className="m-0 text-3xl font-bold tracking-normal">Customers</h1>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 xl:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(220px,1fr)_180px_auto]" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            First name
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Last name
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Email
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Phone
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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

          <div className="flex flex-wrap gap-2 self-end">
            <button
              className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={status === "submitting" || !isFormValid}
              type="submit"
            >
              {status === "submitting" ? "Saving..." : editingCustomerId === undefined ? "Create customer" : "Update customer"}
            </button>

            {editingCustomerId !== undefined && (
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
            Customer saved.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to save customer.
          </p>
        )}

        {deleteStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to delete customer.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {customers.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {customers.status === "error" && <p className="m-0 p-[18px]">Unable to load customers.</p>}
        {customers.status === "success" && (
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <TableHeader>First name</TableHeader>
                <TableHeader>Last name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {customers.data.map((customer) => (
                <tr key={customer.id}>
                  <TableCell>{customer.firstName}</TableCell>
                  <TableCell>{customer.lastName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <span className={getStatusClassName(customer.isActive)}>
                      {customer.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        type="button"
                        onClick={() => onEdit(customer)}
                      >
                        Edit
                      </button>
                      <button
                        className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                        disabled={deleteStatus === "deleting"}
                        type="button"
                        onClick={() => onDelete(customer)}
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

function formatCustomerName(customer: Customer) {
  return `${customer.firstName} ${customer.lastName}`.trim();
}
