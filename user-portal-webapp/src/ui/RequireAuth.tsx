import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredSession } from "../services/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (getStoredSession() === undefined) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
