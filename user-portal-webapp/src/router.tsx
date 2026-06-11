import { Navigate, createBrowserRouter } from "react-router-dom";
import { ChatPage } from "./pages/ChatPage";
import { CustomerDetailsPage } from "./pages/CustomerDetailsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
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
        path: "chat",
        element: <ChatPage />
      },
      {
        path: "new",
        element: <CustomersPage />
      },
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
