import { formatDate } from "@/components/common/format";

type TimelineItem = {
  id: string;
  action: string;
  actorEmail?: string | null;
  createdAt: Date | string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border bg-white px-4 py-3">
          <div className="text-sm font-medium">{item.action}</div>
          <div className="text-xs text-muted-foreground">
            {item.actorEmail ?? "System"} • {formatDate(item.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
