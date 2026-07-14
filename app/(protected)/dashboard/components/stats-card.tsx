import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<"div"> {
  className?: string;
  title?: string;
  statData?: number;
}
export default function StatsCard({
  className,
  title = "Título",
  statData = 0,
  ...props
}: Props) {
  return (
    <Card {...props} className={cn("p-6", className)}>
      <CardHeader>
        <CardTitle className="text-xl text-center font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center text-2xl">
        <p>{statData}</p>
      </CardContent>
    </Card>
  );
}
