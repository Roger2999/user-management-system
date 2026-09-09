import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HEADER_WIDTHS = ["w-24", "w-40", "w-28", "w-32", "w-16", "w-20", "w-20"];

export default function TableSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-between">
      <Table>
        <TableHeader>
          <TableRow>
            {HEADER_WIDTHS.map((width, i) => (
              <TableHead
                key={i}
                className={
                  i === 4 || i === 5
                    ? "text-center"
                    : i === 6
                      ? "text-right"
                      : undefined
                }
              >
                <Skeleton className={`h-4 ${width}`} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, row) => (
            <TableRow key={row}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="mx-auto size-5 rounded-full" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="mx-auto size-5" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mb-4 flex items-center justify-center gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}