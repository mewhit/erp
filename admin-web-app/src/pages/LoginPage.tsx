import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getStoredSession, login, storeSession } from "../services/auth";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("mikewhittom27@gmail.com");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  if (getStoredSession() !== undefined) {
    return <Navigate to="/" replace />;
  }

  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    try {
      storeSession(await login(email, password));
      navigate(from, { replace: true });
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-[18px] text-slate-900 antialiased">
      <section className="w-full max-w-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <p className="mb-2 text-sm font-bold text-cyan-800">ERP Admin</p>
          <h1 className="m-0 text-3xl font-bold tracking-normal">Sign in</h1>
        </header>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Email
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              autoComplete="email"
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-slate-600" htmlFor="admin-login-password">
              Password
            </label>
            <div className="relative">
              <input
                className="min-h-11 rounded-lg border border-slate-200 px-3 pr-16 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
                id="admin-login-password"
                autoComplete="current-password"
                required
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                aria-pressed={isPasswordVisible}
                className="absolute right-2 top-1/2 min-h-8 -translate-y-1/2 rounded-md px-2 text-xs font-bold text-cyan-800 transition-colors hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-800"
                type="button"
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              >
                {isPasswordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {status === "error" && (
            <p className="m-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
              Invalid email or password.
            </p>
          )}

          <button
            className="min-h-11 rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={status === "submitting"}
            type="submit"
          >
            {status === "submitting" ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
