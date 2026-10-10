import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImageTagDto } from './image-tag.dto.js';
import { ImageQueryDto } from './image-query.dto.js';

describe('Image tag validation', () => {
  it.each([
    undefined,
    null,
    '',
    '../products',
    'products/photos',
    'has space',
    123,
    'a'.repeat(101),
  ])('rejects invalid upload tag %s', async (tag) => {
    expect(
      await validate(plainToInstance(ImageTagDto, { tag })),
    ).not.toHaveLength(0);
  });

  it.each(['products', 'car-image', 'App_123', 'a'.repeat(100)])(
    'accepts valid upload tag %s',
    async (tag) => {
      expect(
        await validate(plainToInstance(ImageTagDto, { tag })),
      ).toHaveLength(0);
    },
  );

  it('allows listing without a tag and transforms pagination', async () => {
    const query = plainToInstance(ImageQueryDto, { page: '2' });
    expect(await validate(query)).toHaveLength(0);
    expect(query.page).toBe(2);
  });

  it('rejects invalid listing tags', async () => {
    expect(
      await validate(plainToInstance(ImageQueryDto, { tag: '../products' })),
    ).not.toHaveLength(0);
  });
});
