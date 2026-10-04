import { requireAdmin } from "@/lib/auth";
import { getChatThreads } from "@/lib/chat";
import { ChatInbox } from "@/components/chat/ChatInbox";

export const metadata = { title: "رسائل الطلاب" };

// The list stays mounted while switching conversations (only the thread pane re-renders).
export default async function ChatsLayout({ children }) {
  await requireAdmin();
  const threads = await getChatThreads();
  return <ChatInbox initialThreads={threads}>{children}</ChatInbox>;
}
