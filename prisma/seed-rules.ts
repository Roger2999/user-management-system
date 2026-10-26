import "dotenv/config";
import prisma from "@/lib/prisma";
import { DEFAULT_CATEGORY_RULES } from "@/lib/reports/rules/defaults";

/**
 * Carga los patrones de prueba de las categorías prohibidas (S5).
 *
 * Es aditivo a propósito: agrega las reglas que falten y reactiva las que
 * existan desactivadas, pero nunca borra ni desactiva una regla propia del
 * especialista. Correrlo dos veces no duplica nada.
 */
async function main() {
  let created = 0;
  let reactivated = 0;
  let unchanged = 0;

  for (const rule of DEFAULT_CATEGORY_RULES) {
    const existing = await prisma.categoryRule.findUnique({
      where: {
        category_matchType_pattern: {
          category: rule.category,
          matchType: rule.matchType,
          pattern: rule.pattern,
        },
      },
      select: { id: true, active: true },
    });

    if (existing === null) {
      await prisma.categoryRule.create({ data: { ...rule, active: true } });
      created += 1;
      continue;
    }

    if (!existing.active) {
      await prisma.categoryRule.update({
        where: { id: existing.id },
        data: { active: true },
      });
      reactivated += 1;
      continue;
    }

    unchanged += 1;
  }

  const byCategory = await prisma.categoryRule.groupBy({
    by: ["category"],
    where: { active: true },
    _count: { _all: true },
    orderBy: { category: "asc" },
  });

  console.log(
    `Reglas nuevas: ${created}. Reactivadas: ${reactivated}. Sin cambios: ${unchanged}.`,
  );
  for (const row of byCategory) {
    console.log(`  ${row.category}: ${row._count._all}`);
  }

  if (!byCategory.some((row) => row.category === "SUBVERSIVE")) {
    console.warn(
      "AVISO: SUBVERSIVE no tiene patrones. Esa lista la define el especialista.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
