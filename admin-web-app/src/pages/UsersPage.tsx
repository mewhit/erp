import { useEffectQuery } from "../hooks";
import { getUsers } from "../services/adminData";

export function UsersPage() {
  const users = useEffectQuery(getUsers);

  return (
    <>
      <header className="mb-[22px]">
        <h1 className="m-0 text-3xl font-bold tracking-normal">Users</h1>
      </header>
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {users.status === "loading" && <p className="m-0 p-[18px]">Loading...</p>}
        {users.status === "error" && <p className="m-0 p-[18px]">Unable to load users.</p>}
        {users.status === "success" && (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user) => (
                <tr key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-[18px] py-3.5 text-left text-xs font-bold uppercase text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-slate-100 px-[18px] py-3.5 text-left">{children}</td>;
}
