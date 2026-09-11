import { Skeleton } from "@/components/ui/skeleton";

function SkeletonRow({
  cols,
  h = 9.7,
  lines,
  last = false,
}: {
  cols: string[];
  h?: number;
  lines?: number;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-stretch overflow-hidden ${
        last ? "" : "border-b-[0.5pt] border-black"
      }`}
      style={{ minHeight: `${h}pt` }}
    >
      {cols.map((width, i) => (
        <div
          key={i}
          className={`flex min-w-0 items-center gap-[3pt] px-[4pt] ${
            i < cols.length - 1 ? "border-r-[0.5pt] border-black" : ""
          } ${width}`}
        >
          {i === 0 && lines ? (
            <div className="flex w-full flex-col justify-center gap-[2pt]">
              {Array.from({ length: lines }).map((_, l) => (
                <Skeleton key={l} className="h-[5pt] w-full rounded-none" />
              ))}
            </div>
          ) : (
            <Skeleton className="h-[60%] w-full rounded-none" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="bg-muted/40 min-h-screen p-4">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end">
        <Skeleton className="h-9 w-52 rounded-md" />
      </div>
      <div className="mx-auto w-[216mm] max-w-full bg-white p-[8mm]">
        <div className="overflow-x-auto">
          <div className="mx-auto w-[201mm] zoom-[0.45] sm:zoom-[0.58] md:zoom-[0.7] lg:zoom-[0.85] xl:zoom-[1]">
            <Skeleton className="mx-auto mb-4 h-5 w-3/4 rounded-none" />
            <div className="border-[0.5pt] border-black">
              {/* UD-PG 0074-A1.1 + Folio + Tipo de gestión */}
              <SkeletonRow cols={["w-[21.3%]", "flex-1"]} />
              <SkeletonRow cols={["w-[34.3%]", "flex-1"]} />
              <SkeletonRow
                cols={["w-[25.3%]", "w-[11.6%]", "w-[18.6%]", "flex-1"]}
                h={12.7}
              />

              {/* Datos de gestión */}
              <SkeletonRow cols={["flex-1"]} h={12.7} />
              <SkeletonRow cols={["flex-1"]} h={12.7} />
              <SkeletonRow cols={["w-[37.7%]", "flex-1"]} h={12.7} />
              <SkeletonRow cols={["flex-1"]} h={12.7} />
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["flex-1"]} h={12.7} />

              {/* SERVICIOS REQUERIDOS */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} h={28.1} lines={3} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} h={19.4} lines={2} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} />
              <SkeletonRow cols={["w-[35.2%]", "flex-1"]} h={18.9} lines={2} />

              {/* TIPO DE CUENTA */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["flex-1"]} h={18.9} lines={2} />

              {/* DÍAS Y HORAS DE USO */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["flex-1"]} h={16.5} lines={2} />
              <SkeletonRow cols={["w-[42.4%]", "flex-1"]} h={25.1} lines={2} />

              {/* ACCESO POR APN */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["flex-1"]} h={14.4} lines={2} />

              {/* Autorización de PC */}
              <SkeletonRow cols={["w-[36.8%]", "flex-1"]} h={18.9} lines={2} />
              <SkeletonRow cols={["w-[36.8%]", "flex-1"]} h={30.2} lines={2} />

              {/* Firmas: SOLICITADO POR / REVISADO POR / APROBADO POR / EJECUTADO POR */}
              {/* B1: SOLICITADO POR — labels 9.7, sign 21.2 */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} h={21.2} />
              {/* B2: REVISADO POR — labels 21.2, sign 21.2 */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} h={21.2} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} h={21.2} />
              {/* B3: APROBADO POR — labels 9.7, sign 17.8 */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} h={17.8} />
              {/* B4: EJECUTADO POR — labels 17.8, sign 17.8 */}
              <SkeletonRow cols={["flex-1"]} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} h={17.8} />
              <SkeletonRow cols={["w-[26.4%]", "w-[26.3%]", "w-[14.6%]", "flex-1"]} h={17.8} />

              {/* BAJA DE LA ENTIDAD */}
              <SkeletonRow
                cols={["w-[26.4%]", "w-[40.9%]", "flex-1"]}
                h={33.9}
                last
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}