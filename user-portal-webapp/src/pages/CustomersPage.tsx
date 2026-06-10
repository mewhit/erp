import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import { addCustomer, getCustomersForOrganization } from "../services/userData";
import type { PortalOutletContext } from "../ui/RootLayout";

export function CustomersPage() {
  const { organizationsStatus, selectedOrganization, selectedOrganizationId } =
    useOutletContext<PortalOutletContext>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [savedCustomerName, setSavedCustomerName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();
  const customersProgram = useMemo(
    () => getCustomersForOrganization(selectedOrganizationId),
    [selectedOrganizationId, reloadKey]
  );
  const customers = useEffectQuery(customersProgram);
  const normalizedEmail = email.trim().toLowerCase();
  const isFormValid =
    selectedOrganizationId !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "";

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    const customer = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim()
    };

    void Effect.runPromise(
      addCustomer({
        organizationId: selectedOrganizationId,
        customer
      })
    ).then(
      (result) => {
        setSavedCustomerName(`${customer.firstName} ${customer.lastName}`.trim());
        resetForm();
        setReloadKey((current) => current + 1);
        setStatus("success");
        navigate(`/customers/${result.customer.id}`);
      },
      () => {
        setStatus("error");
      }
    );
  };

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Customers</h1>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 lg:col-span-2">
            Organization:{" "}
            <span className="font-normal text-slate-900">
              {selectedOrganization?.name ??
                (organizationsStatus === "loading" ? "Loading..." : "Select an organization")}
            </span>
          </div>

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

          <div className="flex flex-wrap gap-2 self-end lg:col-span-2">
            <button
              className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={status === "submitting" || !isFormValid}
              type="submit"
            >
              {status === "submitting" ? "Adding..." : "Add customer"}
            </button>
          </div>
        </form>

        {organizationsStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to load organizations.
          </p>
        )}

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            {savedCustomerName} added.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to add customer.
          </p>
        )}
      </section>

      <section className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {customers.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {customers.status === "error" && <p className="m-0 p-[18px]">Unable to load customers.</p>}
        {customers.status === "success" && customers.data.length === 0 && (
          <p className="m-0 p-[18px]">No customers.</p>
        )}
        {customers.status === "success" && customers.data.length > 0 && (
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Created</TableHeader>
              </tr>
            </thead>
            <tbody>
              {customers.data.map((customer) => (
                <tr key={customer.id}>
                  <TableCell>
                    <Link
                      className="font-bold text-cyan-800 no-underline hover:text-slate-900"
                      to={`/customers/${customer.id}`}
                    >
                      {customer.firstName} {customer.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
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
