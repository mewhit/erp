import { Effect } from "effect";

export type Order = {
  id: string;
  number: string;
  status: "processing" | "shipped" | "delivered";
  total: number;
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: "open" | "waiting" | "resolved";
  updatedAt: string;
};

const orders: Order[] = [
  { id: "ord-001", number: "SO-1042", status: "processing", total: 1280 },
  { id: "ord-002", number: "SO-1041", status: "shipped", total: 640 },
  { id: "ord-003", number: "SO-1038", status: "delivered", total: 2140 }
];

const tickets: SupportTicket[] = [
  { id: "tkt-001", subject: "Invoice copy request", status: "open", updatedAt: "2026-06-03" },
  { id: "tkt-002", subject: "Delivery address update", status: "waiting", updatedAt: "2026-06-02" },
  { id: "tkt-003", subject: "Warranty confirmation", status: "resolved", updatedAt: "2026-05-29" }
];

export const getOrders = Effect.succeed(orders);

export const getSupportTickets = Effect.succeed(tickets);

export const getDashboardStats = Effect.all({
  orders: getOrders.pipe(Effect.map((items) => items.length)),
  activeOrders: getOrders.pipe(
    Effect.map((items) => items.filter((item) => item.status !== "delivered").length)
  ),
  tickets: getSupportTickets.pipe(Effect.map((items) => items.length)),
  openTickets: getSupportTickets.pipe(
    Effect.map((items) => items.filter((item) => item.status !== "resolved").length)
  )
});
