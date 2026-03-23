import { getSessionUser } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { getConversationsWithUnreadCounts } from "@/actions/messaging";
import { MessagesClient } from "@/components/shared/messages-client";

export const metadata = {
  title: "Messages | CareCircle",
};

export default async function MessagesPage() {
  const user = await getSessionUser();
  const conversations = await getConversationsWithUnreadCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={user.role} userName={user.name} />
      <main className="lg:pl-[270px]">
        <MessagesClient
          conversations={conversations}
          currentUserId={user.id}
          userRole={user.role}
        />
      </main>
    </div>
  );
}
