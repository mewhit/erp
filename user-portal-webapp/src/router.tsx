import { createBrowserRouter } from "react-router-dom";
import { CustomerDetailsPage } from "./pages/CustomerDetailsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SupportPage } from "./pages/SupportPage";
import { WorkOrderDetailsPage } from "./pages/WorkOrderDetailsPage";
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
        path: "orders",
        element: <OrdersPage />
      },
      {
        path: "work-orders/:workOrderId",
        element: <WorkOrderDetailsPage />
      },
      {
        path: "customers",
        element: <CustomersPage />
      },
      {
        path: "customers/:customerId",
        element: <CustomerDetailsPage />
      },
      {
        path: "new",
        element: <CustomersPage />
      },
      {
        path: "support",
        element: <SupportPage />
      }
    ]
  }
]);
