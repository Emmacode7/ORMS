import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar user={user} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={user} unreadCount={unreadCount} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
