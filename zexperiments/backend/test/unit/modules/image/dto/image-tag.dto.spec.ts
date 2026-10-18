import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImageTagDto } from '../../../../../src/modules/image/dto/image-tag.dto.js';
import { ImageQueryDto } from '../../../../../src/modules/image/dto/image-query.dto.js';

describe('Image tag validation', () => {
  it.each([
    'unknown-tag',
    'App_123',
    'a'.repeat(100),
    undefined,
    null,
    '',
    '../car-image',
    'car-image/photos',
    'has space',
    123,
    'a'.repeat(101),
  ])('rejects invalid upload tag %s', async (tag) => {
    expect(
      await validate(plainToInstance(ImageTagDto, { tag })),
    ).not.toHaveLength(0);
  });

  it.each(['car-image'])('accepts valid upload tag %s', async (tag) => {
    expect(await validate(plainToInstance(ImageTagDto, { tag }))).toHaveLength(
      0,
    );
  });

  it('allows listing without a tag and transforms pagination', async () => {
    const query = plainToInstance(ImageQueryDto, { page: '2' });
    expect(await validate(query)).toHaveLength(0);
    expect(query.page).toBe(2);
  });

  it.each(['../car-image', 'unknown-tag', 'App_123'])(
    'rejects invalid listing tag %s',
    async (tag) => {
      expect(
        await validate(plainToInstance(ImageQueryDto, { tag })),
      ).not.toHaveLength(0);
    },
  );
});
