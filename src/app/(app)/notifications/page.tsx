import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Notifications</h1>
          <p className="text-sm text-ink-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <ul className="divide-y divide-line-200 rounded-md border border-line-300 bg-white">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn("flex items-start justify-between gap-3 px-4 py-3", !n.isRead && "bg-navy-50/40")}
            >
              <div>
                {n.requestId ? (
                  <Link href={`/requests/${n.requestId}`} className="text-sm text-ink-900 hover:underline">
                    {n.message}
                  </Link>
                ) : (
                  <p className="text-sm text-ink-900">{n.message}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-500">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="notificationId" value={n.id} />
                  <button type="submit" className="shrink-0 text-xs font-medium text-navy-700 hover:underline">
                    Mark read
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
