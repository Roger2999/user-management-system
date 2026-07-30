"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useTransition } from "react";
import { Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
export default function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [isPending, startTransition] = useTransition();

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set("search", e.target.value);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      replace(`${pathname}?${params}`);
    });
  };

  return (
    <div className="flex justify-center">
      <div className="relative w-md">
        <label htmlFor="search-bar" className="sr-only">
          Buscar
        </label>
        <Input
          className="h-12 px-4 placeholder:text-[1.2rem]"
          name="search-bar"
          defaultValue={searchParams.get("search") || undefined}
          onChange={onInputChange}
          placeholder="Buscar . . ."
        />
        {isPending ? (
          <Spinner className="absolute top-3 right-5 size-5" />
        ) : (
          <Search className="absolute top-3 right-5 size-5" />
        )}
      </div>
    </div>
  );
}
