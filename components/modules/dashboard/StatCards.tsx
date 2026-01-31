import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Stat = {
  label: string;
  value: number | string;
  hint?: string;
};

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{stat.value}</div>
            {stat.hint ? <Badge variant="secondary">{stat.hint}</Badge> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
