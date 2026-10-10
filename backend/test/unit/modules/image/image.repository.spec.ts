import { ImageRepository } from '../../../../src/modules/image/image.repository.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';

const pagination = { page: 1, perPage: 50, skip: 0, take: 50 };

function setup() {
  const image = {
    create: vi
      .fn()
      .mockResolvedValue({ key: 'products/test', tag: 'products' }),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  };
  const prisma = {
    image,
    $transaction: vi.fn((queries) => Promise.all(queries)),
  };
  return {
    image,
    repository: new ImageRepository(prisma as unknown as PrismaService),
  };
}

describe('ImageRepository', () => {
  it('persists the tag alongside the storage key', async () => {
    const { image, repository } = setup();
    await repository.create('products/test', 'products');
    expect(image.create).toHaveBeenCalledWith({
      data: { key: 'products/test', tag: 'products' },
    });
  });

  it.each([undefined, 'products'])(
    'uses the same tag filter for records and totals (%s)',
    async (tag) => {
      const { image, repository } = setup();
      await repository.findAll(pagination, tag);
      const where = tag === undefined ? {} : { tag };
      expect(image.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(image.count).toHaveBeenCalledWith({ where });
    },
  );

  it('combines the tag and unlinked filters for records and totals', async () => {
    const { image, repository } = setup();
    await repository.findAllUnlinked(pagination, 'products');
    const where = { serviceOrderId: null, tag: 'products' };
    expect(image.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(image.count).toHaveBeenCalledWith({ where });
  });
});
