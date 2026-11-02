import { and, eq } from 'drizzle-orm';
import type { DatabaseService } from '../database.service.js';
import { taxProviders, taxBrands } from '../schemas/taxes.schema.js';
import { initialTaxBrands, initialTaxProvider } from './card-fees.data.js';

export async function seedCardFees(
  database: DatabaseService,
  organizationId: string,
): Promise<number> {
  return database.db.transaction(async (tx) => {
    await tx
      .insert(taxProviders)
      .values({ ...initialTaxProvider, organizationId })
      .onConflictDoNothing({ target: [taxProviders.organizationId, taxProviders.name] });
    // Serializa seeds concorrentes do mesmo provedor para não duplicar bandeiras.
    const [provider] = await tx
      .select({ id: taxProviders.id })
      .from(taxProviders)
      .where(
        and(
          eq(taxProviders.organizationId, organizationId),
          eq(taxProviders.name, initialTaxProvider.name),
        ),
      )
      .limit(1)
      .for('update');
    if (!provider) throw new Error('Provedor inicial de taxas não encontrado.');

    // Bandeiras são reconhecidas pelo nome; as existentes são preservadas sem alterações.
    const existing = await tx
      .select({ name: taxBrands.name })
      .from(taxBrands)
      .where(
        and(eq(taxBrands.organizationId, organizationId), eq(taxBrands.providerId, provider.id)),
      );
    const names = new Set(existing.map((brand) => brand.name));
    const missing = initialTaxBrands.filter((brand) => !names.has(brand.name));
    if (!missing.length) return 0;

    await tx.insert(taxBrands).values(
      missing.map(({ rates, ...values }) => ({
        ...values,
        organizationId,
        providerId: provider.id,
        rates: rates.map((ratePercent, index) => ({ installments: index + 1, ratePercent })),
      })),
    );
    return missing.length;
  });
}
