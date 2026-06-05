import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SupportPage } from "./pages/SupportPage";
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
        path: "support",
        element: <SupportPage />
      }
    ]
  }
]);
