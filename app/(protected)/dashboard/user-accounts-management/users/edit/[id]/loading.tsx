import { Skeleton } from "@/components/ui/skeleton";

function FieldSkeleton() {
  return (
    <div className="min-h-26 space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

function CheckboxSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-6 shrink-0" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function FormCardSkeleton({
  titleWidth,
  children,
  className,
}: {
  titleWidth: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="bg-card text-card-foreground ring-foreground/10 flex flex-col gap-4 overflow-hidden rounded-xl py-4 ring-1">
      <div className="px-4">
        <Skeleton className={`h-5 ${titleWidth}`} />
      </div>
      <div className={className}>{children}</div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="py-8">
      <div className="xs:px-8 space-y-6 sm:px-20">
        <Skeleton className="h-7 w-72" />
        <form className="grid gap-6 lg:grid-cols-2">
          <FormCardSkeleton titleWidth="w-36">
            <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </FormCardSkeleton>
          <FormCardSkeleton titleWidth="w-40">
            <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </FormCardSkeleton>
          <FormCardSkeleton titleWidth="w-40">
            <div className="grid grid-cols-3 gap-3 px-4">
              <CheckboxSkeleton />
              <CheckboxSkeleton />
              <CheckboxSkeleton />
            </div>
          </FormCardSkeleton>
          <FormCardSkeleton titleWidth="w-36">
            <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </FormCardSkeleton>
          <FormCardSkeleton titleWidth="w-32">
            <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
              <CheckboxSkeleton />
              <CheckboxSkeleton />
              <CheckboxSkeleton />
              <CheckboxSkeleton />
            </div>
          </FormCardSkeleton>
          <FormCardSkeleton titleWidth="w-36">
            <div className="px-4">
              <FieldSkeleton />
            </div>
          </FormCardSkeleton>
          <Skeleton className="h-14 w-full rounded-lg lg:col-span-2" />
        </form>
      </div>
    </div>
  );
}