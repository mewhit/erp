import { Effect } from "effect";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import { deactivateUser, getUser, updateUserPassword } from "../services/adminData";
import { generateRandomPassword } from "../utils/password";

export function UserDetailPage() {
  const navigate = useNavigate();
  const { userId = "" } = useParams();
  const [password, setPassword] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [deactivateStatus, setDeactivateStatus] = useState<"idle" | "deactivating" | "error">("idle");
  const userProgram = useMemo(() => getUser(userId), [userId, reloadKey]);
  const user = useEffectQuery(userProgram);
  const isFormValid = userId !== "" && password.trim() !== "";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setStatus("submitting");

    void Effect.runPromise(
      updateUserPassword(userId, {
        password
      })
    ).then(
      () => {
        setStatus("success");
        setReloadKey((current) => current + 1);
      },
      () => {
        setStatus("error");
      }
    );
  };

  const onGeneratePassword = () => {
    setPassword(generateRandomPassword());
    setStatus("idle");
  };

  const onDeactivate = () => {
    if (
      userId === "" ||
      !window.confirm("Deactivate this user?")
    ) {
      return;
    }

    setDeactivateStatus("deactivating");

    void Effect.runPromise(deactivateUser(userId)).then(
      () => {
        navigate("/users", { replace: true });
      },
      () => {
        setDeactivateStatus("error");
      }
    );
  };

  if (user.status === "loading") {
    return <PageFrame title="User">Loading...</PageFrame>;
  }

  if (user.status === "error") {
    return <PageFrame title="User">Unable to load user.</PageFrame>;
  }

  return (
    <>
      <header className="mb-[22px] grid gap-2">
        <Link className="text-sm font-bold text-cyan-800 no-underline" to="/users">
          Back to users
        </Link>
        <div>
          <h1 className="m-0 text-3xl font-bold tracking-normal">{user.data.name}</h1>
          <p className="mt-1 mb-0 text-sm text-slate-500">{user.data.email}</p>
        </div>
      </header>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-[18px] shadow-sm">
        <dl className="mb-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Name</dt>
            <dd className="mt-1 mb-0 text-slate-900">{user.data.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Email</dt>
            <dd className="mt-1 mb-0 text-slate-900">{user.data.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Created</dt>
            <dd className="mt-1 mb-0 text-slate-900">{formatDate(user.data.createdAt)}</dd>
          </div>
        </dl>

        <form className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_auto_auto]" onSubmit={onSubmit}>
          <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-600">
            Password
            <input
              className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-base font-normal text-slate-900 outline-none transition-colors focus:border-cyan-800"
              required
              type="text"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setStatus("idle");
              }}
            />
          </label>

          <button
            className="min-h-11 self-end rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-600 transition-colors hover:bg-slate-100"
            type="button"
            onClick={onGeneratePassword}
          >
            Generate
          </button>

          <button
            className="min-h-11 self-end rounded-lg bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={status === "submitting" || !isFormValid}
            type="submit"
          >
            {status === "submitting" ? "Saving..." : "Save"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 mb-0 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
            Password saved.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to save password.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-[18px] shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-bold tracking-normal text-slate-900">Deactivate user</h2>
            <p className="mt-1 mb-0 text-sm text-slate-500">
              Hide this user from active admin lists without removing historical records.
            </p>
          </div>
          <button
            className="min-h-11 rounded-lg border border-red-200 bg-white px-4 font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
            disabled={deactivateStatus === "deactivating"}
            type="button"
            onClick={onDeactivate}
          >
            {deactivateStatus === "deactivating" ? "Deactivating..." : "Deactivate"}
          </button>
        </div>

        {deactivateStatus === "error" && (
          <p className="mt-4 mb-0 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            Unable to deactivate user.
          </p>
        )}
      </section>
    </>
  );
}

function PageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">{title}</h1>
      </header>
      {children}
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}
