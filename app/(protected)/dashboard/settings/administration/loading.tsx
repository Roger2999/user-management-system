import { Skeleton } from "@/components/ui/skeleton";
import FormCardSkeleton from "../components/form-card-skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <FormCardSkeleton fields={6} />
      <FormCardSkeleton fields={3} />

      <div className="space-y-3 rounded-xl border p-6">
        <Skeleton className="h-6 w-52 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>
    </div>
  );
}
