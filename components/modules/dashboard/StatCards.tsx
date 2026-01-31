import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kpiCardClass, kpiIcon, kpiIconClass, type KpiType } from "@/lib/ui/kpi";

type Stat = {
  label: string;
  value: number | string;
  hint?: string;
  type: KpiType;
};

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = kpiIcon(stat.type);
        return (
        <Card key={stat.label} className={kpiCardClass(stat.type)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-2">
              {stat.hint ? <Badge variant="secondary">{stat.hint}</Badge> : null}
              <Icon className={`h-5 w-5 ${kpiIconClass(stat.type)}`} />
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
