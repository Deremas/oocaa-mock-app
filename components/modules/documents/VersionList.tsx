import { formatDate } from "@/components/common/format";

type VersionItem = {
  id: string;
  versionNumber: number;
  createdAt: Date | string;
  snapshotJson: Record<string, unknown>;
};

export function VersionList({ versions }: { versions: VersionItem[] }) {
  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <div key={version.id} className="rounded-md border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Version {version.versionNumber}</div>
            <div className="text-xs text-muted-foreground">{formatDate(version.createdAt)}</div>
          </div>
          <pre className="mt-3 max-h-64 overflow-auto rounded bg-slate-950/90 p-3 text-xs text-slate-50">
            {JSON.stringify(version.snapshotJson, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
