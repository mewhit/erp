import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useEffectQuery } from "../hooks";
import { clearSession, getStoredSession } from "../services/auth";
import { getOrganizations, type Organization } from "../services/userData";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Work orders" },
  { to: "/customers", label: "Customers" }
];

export type PortalOutletContext = {
  organizations: Organization[];
  organizationsStatus: "loading" | "success" | "error";
  selectedOrganization: Organization | undefined;
  selectedOrganizationId: string;
  setSelectedOrganizationId: (organizationId: string) => void;
};

export function RootLayout() {
  const navigate = useNavigate();
  const session = getStoredSession();
  const organizationsProgram = useMemo(() => getOrganizations(), []);
  const organizations = useEffectQuery(organizationsProgram);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const organizationList = organizations.status === "success" ? organizations.data : [];
  const selectedOrganization = organizationList.find(
    (organization) => organization.id === selectedOrganizationId
  );

  useEffect(() => {
    if (organizations.status !== "success") {
      return;
    }

    setSelectedOrganizationId((currentOrganizationId) => {
      if (organizations.data.length === 0) {
        return "";
      }

      if (organizations.data.length === 1) {
        return organizations.data[0].id;
      }

      return organizations.data.some(
        (organization) => organization.id === currentOrganizationId
      )
        ? currentOrganizationId
        : "";
    });
  }, [organizations]);

  const onLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 text-slate-900 antialiased md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border-b border-slate-200 bg-white px-[18px] py-[18px] md:border-r md:border-b-0 md:py-6">
        <div className="grid gap-1">
          <div className="text-[1.05rem] font-bold">User Portal</div>
          {session !== undefined && <div className="text-sm text-slate-500">{session.user.name}</div>}
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-bold uppercase text-slate-500" htmlFor="portal-organization">
            Organization
          </label>
          <select
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-cyan-800 disabled:bg-slate-50 disabled:text-slate-500"
            disabled={organizations.status !== "success" || organizationList.length <= 1}
            id="portal-organization"
            value={selectedOrganizationId}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
          >
            <option value="">
              {organizations.status === "loading"
                ? "Loading..."
                : organizationList.length === 0
                  ? "No organization"
                  : "Select organization"}
            </option>
            {organizationList.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </div>
        <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-2.5 text-center no-underline transition-colors md:text-left",
                  isActive ? "bg-cyan-800 text-white" : "text-slate-600 hover:bg-slate-100"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100 md:mt-auto"
          type="button"
          onClick={onLogout}
        >
          Sign out
        </button>
      </aside>
      <main className="w-full max-w-6xl px-[18px] py-[22px] md:px-8 md:py-8">
        <Outlet
          context={{
            organizations: organizationList,
            organizationsStatus: organizations.status,
            selectedOrganization,
            selectedOrganizationId,
            setSelectedOrganizationId
          }}
        />
      </main>
    </div>
  );
}
