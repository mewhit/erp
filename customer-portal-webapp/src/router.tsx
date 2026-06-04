import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SupportPage } from "./pages/SupportPage";
import { RootLayout } from "./ui/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
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
