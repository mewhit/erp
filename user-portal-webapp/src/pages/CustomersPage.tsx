import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import { addCustomer, getOrganizations } from "../services/userData";

export function CustomersPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [savedCustomerName, setSavedCustomerName] = useState("");
  const organizationsProgram = useMemo(() => getOrganizations(), []);
  const organizations = useEffectQuery(organizationsProgram);
  const normalizedEmail = email.trim().toLowerCase();
  const isFormValid =
    organizationId !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    normalizedEmail !== "";

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
        organizationId,
        customer
      })
    ).then(
      () => {
        setSavedCustomerName(`${customer.firstName} ${customer.lastName}`.trim());
        resetForm();
        setStatus("success");
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
          <label className="grid gap-2 text-sm font-bold text-slate-600 lg:col-span-2">
            Organization
            <select
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              disabled={organizations.status === "loading"}
              required
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
            >
              <option value="">
                {organizations.status === "loading" ? "Loading organizations" : "Select organization"}
              </option>
              {organizations.status === "success" &&
                organizations.data.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
            </select>
          </label>

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

        {organizations.status === "error" && (
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
    </>
  );
}
