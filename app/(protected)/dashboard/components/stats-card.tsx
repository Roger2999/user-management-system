import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<"div"> {
  className?: string;
  title?: string;
  statData?: number;
  icon?: React.ComponentType<{ className?: string }>;
}
export default function StatsCard({
  className,
  title = "Título",
  statData = 0,
  icon: Icon,
  ...props
}: Props) {
  return (
    <Card {...props} className={cn("p-6 transition-colors hover:bg-card-hover", className)}>
      <CardHeader>
        <CardTitle className="text-center text-base font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <CardAction>
            <Icon className="size-6 text-brand" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-center text-3xl font-semibold">
        <p>{statData}</p>
      </CardContent>
    </Card>
  );
}
