import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
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
    <Card
      {...props}
      className={cn("hover:bg-card-hover p-6 transition-colors", className)}
    >
      <CardHeader>
        <CardTitle className="text-muted-foreground text-center text-base font-medium">
          {title}
        </CardTitle>
        {Icon && (
          <CardAction>
            <Icon className="text-brand size-6" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="mr-6 flex items-center justify-center text-3xl font-semibold">
        <p>{statData}</p>
      </CardContent>
    </Card>
  );
}
