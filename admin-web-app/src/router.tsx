import { createBrowserRouter } from "react-router-dom";
import { CustomerWorkOrdersPage } from "./pages/CustomerWorkOrdersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ItemsPage } from "./pages/ItemsPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationCustomersPage } from "./pages/OrganizationCustomersPage";
import { OrganizationDetailPage } from "./pages/OrganizationDetailPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { RolesPage } from "./pages/RolesPage";
import { UsersPage } from "./pages/UsersPage";
import { WorkOrderItemsPage } from "./pages/WorkOrderItemsPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { RequireAuth } from "./ui/RequireAuth";
import { RootLayout } from "./ui/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <RootLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "items",
        element: <ItemsPage />
      },
      {
        path: "customers",
        element: <CustomersPage />
      },
      {
        path: "organization-customers",
        element: <OrganizationCustomersPage />
      },
      {
        path: "work-orders",
        element: <WorkOrdersPage />
      },
      {
        path: "work-order-items",
        element: <WorkOrderItemsPage />
      },
      {
        path: "customer-work-orders",
        element: <CustomerWorkOrdersPage />
      },
      {
        path: "organizations",
        element: <OrganizationsPage />
      },
      {
        path: "organizations/:organizationId",
        element: <OrganizationDetailPage />
      },
      {
        path: "roles",
        element: <RolesPage />
      },
      {
        path: "users",
        element: <UsersPage />
      }
    ]
  }
]);
