import { Effect } from "effect";

export type Organization = {
  id: string;
  name: string;
  status: "active" | "pending" | "archived";
  seats: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
};

const organizations: Organization[] = [
  { id: "org-001", name: "Northwind Logistics", status: "active", seats: 42 },
  { id: "org-002", name: "Contoso Finance", status: "pending", seats: 18 },
  { id: "org-003", name: "Fabrikam Supply", status: "active", seats: 67 }
];

const users: User[] = [
  { id: "usr-001", name: "Maya Chen", email: "maya.chen@example.com", role: "Owner" },
  { id: "usr-002", name: "Jordan Ellis", email: "jordan.ellis@example.com", role: "Admin" },
  { id: "usr-003", name: "Samira Patel", email: "samira.patel@example.com", role: "Member" }
];

export const getOrganizations = Effect.succeed(organizations);

export const getUsers = Effect.succeed(users);

export const getDashboardStats = Effect.all({
  organizations: getOrganizations.pipe(Effect.map((items) => items.length)),
  activeOrganizations: getOrganizations.pipe(
    Effect.map((items) => items.filter((item) => item.status === "active").length)
  ),
  users: getUsers.pipe(Effect.map((items) => items.length)),
  seats: getOrganizations.pipe(
    Effect.map((items) => items.reduce((total, item) => total + item.seats, 0))
  )
});
