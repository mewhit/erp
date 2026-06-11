import { Effect } from "effect";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useEffectQuery } from "../hooks";
import {
  getChatConversation,
  getChatWebSocketUrl,
  parseChatServerEvent,
  type ChatMessage
} from "../services/chat";
import { getStoredSession } from "../services/auth";
import { getOrganizationUsers, type User } from "../services/userData";
import type { PortalOutletContext } from "../ui/RootLayout";

type ChatConnectionStatus = "connecting" | "open" | "closed" | "error";

type DisplayMessage = ChatMessage & {
  delivered?: boolean;
};

export function ChatPage() {
  const { selectedOrganizationId, selectedOrganization } =
    useOutletContext<PortalOutletContext>();
  const session = getStoredSession();
  const currentUserId = session?.user.id ?? "";
  const [selectedUserId, setSelectedUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ReadonlyArray<DisplayMessage>>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ChatConnectionStatus>("closed");
  const socketRef = useRef<WebSocket | undefined>(undefined);
  const usersProgram = useMemo(
    () => getOrganizationUsers(selectedOrganizationId),
    [selectedOrganizationId]
  );
  const users = useEffectQuery(usersProgram);
  const conversationProgram = useMemo(
    () => getChatConversation(selectedOrganizationId, selectedUserId),
    [selectedOrganizationId, selectedUserId]
  );
  const conversationHistory = useEffectQuery(conversationProgram);
  const availableUsers =
    users.status === "success"
      ? users.data.filter((user) => user.id !== currentUserId)
      : [];
  const selectedUser = availableUsers.find((user) => user.id === selectedUserId);
  const userById = new Map(
    [
      ...(users.status === "success" ? users.data : []),
      ...(session === undefined ? [] : [session.user])
    ].map((user) => [user.id, user])
  );
  const conversationMessages = messages.filter(
    (message) =>
      selectedUserId !== "" &&
      ((message.fromUserId === currentUserId &&
        message.toUserId === selectedUserId) ||
        (message.fromUserId === selectedUserId &&
          message.toUserId === currentUserId))
  );

  useEffect(() => {
    setSelectedUserId((current) =>
      availableUsers.some((user) => user.id === current)
        ? current
        : availableUsers[0]?.id ?? ""
    );
  }, [availableUsers]);

  useEffect(() => {
    if (conversationHistory.status !== "success") {
      return;
    }

    setMessages((current) => {
      const messageById = new Map(current.map((message) => [message.id, message]));

      for (const message of conversationHistory.data) {
        if (!messageById.has(message.id)) {
          messageById.set(message.id, message);
        }
      }

      return Array.from(messageById.values()).sort((left, right) =>
        left.sentAt === right.sentAt
          ? left.id.localeCompare(right.id)
          : left.sentAt.localeCompare(right.sentAt)
      );
    });
  }, [conversationHistory]);

  useEffect(() => {
    if (session === undefined || selectedOrganizationId === "") {
      setConnectionStatus("closed");
      return;
    }

    const socket = new WebSocket(
      getChatWebSocketUrl(session.token, selectedOrganizationId)
    );
    socketRef.current = socket;
    setConnectionStatus("connecting");

    socket.addEventListener("open", () => {
      setConnectionStatus("open");
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("closed");
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("error");
    });

    socket.addEventListener("message", async (event) => {
      const rawEvent = await readWebSocketMessage(event.data);

      if (rawEvent === undefined) {
        return;
      }

      const serverEvent = parseChatServerEvent(rawEvent);

      if (serverEvent === undefined) {
        return;
      }

      if (serverEvent.type === "message") {
        setMessages((current) => {
          if (current.some((message) => message.id === serverEvent.message.id)) {
            return current;
          }

          const optimisticIndex = current.findIndex(
            (message) =>
              message.id.startsWith("local-") &&
              (message.id === serverEvent.message.clientMessageId ||
                (message.fromUserId === serverEvent.message.fromUserId &&
                  message.toUserId === serverEvent.message.toUserId &&
                  message.text === serverEvent.message.text))
          );

          if (optimisticIndex === -1) {
            return [...current, serverEvent.message];
          }

          return current.map((message, index) =>
            index === optimisticIndex
              ? {
                  ...serverEvent.message,
                  delivered: message.delivered
                }
              : message
          );
        });
      }

      if (serverEvent.type === "delivery") {
        setMessages((current) => {
          const deliveredMessageIndex = current.findIndex(
            (message) =>
              message.id === serverEvent.messageId ||
              (serverEvent.clientMessageId !== undefined &&
                (message.id === serverEvent.clientMessageId ||
                  message.clientMessageId === serverEvent.clientMessageId))
          );

          if (deliveredMessageIndex !== -1) {
            return current.map((message) =>
              message.id === serverEvent.messageId ||
              (serverEvent.clientMessageId !== undefined &&
                (message.id === serverEvent.clientMessageId ||
                  message.clientMessageId === serverEvent.clientMessageId))
                ? {
                    ...message,
                    delivered: serverEvent.delivered
                  }
                : message
            );
          }

          let latestPendingSentIndex = -1;

          for (let index = current.length - 1; index >= 0; index -= 1) {
            const message = current[index];

            if (
              message.fromUserId === currentUserId &&
              message.delivered === undefined
            ) {
              latestPendingSentIndex = index;
              break;
            }
          }

          if (latestPendingSentIndex === -1) {
            return current;
          }

          return current.map((message, index) =>
            index === latestPendingSentIndex
              ? {
                  ...message,
                  delivered: serverEvent.delivered
                }
              : message
          );
        });
      }
    });

    return () => {
      socket.close();
      socketRef.current = undefined;
    };
  }, [selectedOrganizationId, session?.token]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();
    const socket = socketRef.current;
    const clientMessageId = `local-${crypto.randomUUID()}`;

    if (
      selectedUserId === "" ||
      text === "" ||
      socket === undefined ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: clientMessageId,
        organizationId: selectedOrganizationId,
        fromUserId: currentUserId,
        toUserId: selectedUserId,
        text,
        sentAt: new Date().toISOString()
      }
    ]);
    socket.send(
      JSON.stringify({
        type: "send_message",
        toUserId: selectedUserId,
        text,
        clientMessageId
      })
    );
    setDraft("");
  };

  return (
    <>
      <header className="mb-[22px] flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-3xl font-bold tracking-normal">Chat</h1>
          <p className="mt-2 mb-0 text-sm text-slate-500">
            {selectedOrganization?.name ?? "No organization selected"}
          </p>
        </div>
        <span
          className={[
            "inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-bold",
            connectionStatus === "open"
              ? "bg-emerald-100 text-emerald-800"
              : connectionStatus === "connecting"
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-100 text-amber-800"
          ].join(" ")}
        >
          {formatConnectionStatus(connectionStatus)}
        </span>
      </header>

      <section className="grid min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 lg:border-r lg:border-b-0">
          <div className="border-b border-slate-200 px-[18px] py-4">
            <h2 className="m-0 text-sm font-bold uppercase text-slate-500">
              People
            </h2>
          </div>

          {selectedOrganizationId === "" && (
            <p className="m-0 p-[18px] text-sm text-slate-500">
              Select an organization.
            </p>
          )}

          {selectedOrganizationId !== "" && users.status === "loading" && (
            <p className="m-0 p-[18px] text-sm text-slate-500">Loading...</p>
          )}

          {selectedOrganizationId !== "" && users.status === "error" && (
            <p className="m-0 p-[18px] text-sm text-amber-700">
              Unable to load users.
            </p>
          )}

          {users.status === "success" && availableUsers.length === 0 && (
            <p className="m-0 p-[18px] text-sm text-slate-500">
              No other users.
            </p>
          )}

          {availableUsers.length > 0 && (
            <div className="grid">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  className={[
                    "grid gap-1 border-0 border-b border-slate-100 bg-white px-[18px] py-3 text-left transition-colors hover:bg-slate-50",
                    selectedUserId === user.id ? "bg-cyan-50" : ""
                  ].join(" ")}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <span className="font-bold text-slate-900">{user.name}</span>
                  <span className="text-sm text-slate-500">{user.email}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="grid min-h-[620px] grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="border-b border-slate-200 px-[18px] py-4">
            <h2 className="m-0 text-lg font-bold">
              {selectedUser?.name ?? "Conversation"}
            </h2>
          </div>

          <div className="min-h-0 overflow-y-auto bg-slate-50 p-[18px]">
            {conversationMessages.length === 0 && (
              <p className="m-0 text-sm text-slate-500">No messages.</p>
            )}

            {conversationMessages.length > 0 && (
              <div className="grid gap-3">
                {conversationMessages.map((message) => {
                  const isMine = message.fromUserId === currentUserId;

                  return (
                    <article
                      key={message.id}
                      className={[
                        "grid max-w-[78%] gap-1 rounded-lg border px-3 py-2 shadow-sm",
                        isMine
                          ? "ml-auto border-cyan-800 bg-cyan-800 text-white"
                          : "mr-auto border-slate-200 bg-white text-slate-900"
                      ].join(" ")}
                    >
                      <div className="text-xs font-bold opacity-80">
                        {formatUserName(userById.get(message.fromUserId))}
                      </div>
                      <p className="m-0 whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <div className="text-xs opacity-75">
                        {formatMessageMeta(message)}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <form
            className="grid gap-3 border-t border-slate-200 p-[18px] sm:grid-cols-[minmax(0,1fr)_120px]"
            onSubmit={onSubmit}
          >
            <textarea
              className="min-h-12 resize-y rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 outline-none transition-colors focus:border-cyan-800 disabled:bg-slate-100"
              disabled={selectedUserId === "" || connectionStatus !== "open"}
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              className="min-h-12 rounded-lg border border-cyan-800 bg-cyan-800 px-4 font-bold text-white transition-colors hover:bg-cyan-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
              disabled={
                selectedUserId === "" ||
                draft.trim() === "" ||
                connectionStatus !== "open"
              }
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function formatUserName(user: Pick<User, "name" | "email"> | undefined) {
  return user?.name ?? user?.email ?? "User";
}

async function readWebSocketMessage(data: unknown): Promise<string | undefined> {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof Blob) {
    return data.text();
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  return undefined;
}

function formatMessageMeta(message: DisplayMessage) {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(message.sentAt));

  if (message.delivered === undefined) {
    return time;
  }

  return `${time} · ${message.delivered ? "Delivered" : "Offline"}`;
}

function formatConnectionStatus(status: ChatConnectionStatus) {
  switch (status) {
    case "connecting":
      return "Connecting";
    case "open":
      return "Connected";
    case "error":
      return "Connection error";
    case "closed":
      return "Disconnected";
  }
}
