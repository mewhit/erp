import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { UsersPage } from "./pages/UsersPage";
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
        path: "organizations",
        element: <OrganizationsPage />
      },
      {
        path: "users",
        element: <UsersPage />
      }
    ]
  }
]);
