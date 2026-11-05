import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  fields?: number;
  className?: string;
};

export default function FormCardSkeleton({ fields = 3, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Skeleton className="h-5 w-40" />
      <div className="flex flex-col gap-2 rounded-xl border p-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="mt-2 h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}
