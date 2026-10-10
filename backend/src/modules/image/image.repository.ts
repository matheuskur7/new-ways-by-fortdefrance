import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';
import type { Image, Prisma } from '../../generated/prisma/client.js';
import type { PaginationParams } from '../../shared/pagination/pagination.js';

type ImageListResult = {
  data: Image[];
  total: number;
};

@Injectable()
export class ImageRepository {
  constructor(private prismaService: PrismaService) {}

  async create(key: string, tag: string): Promise<Image> {
    return this.prismaService.image.create({ data: { key, tag } });
  }

  async findAll(
    pagination: PaginationParams,
    tag?: string,
  ): Promise<ImageListResult> {
    const where: Prisma.ImageWhereInput = tag === undefined ? {} : { tag };
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.image.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prismaService.image.count({ where }),
    ]);

    return { data, total };
  }

  async findAllUnlinked(
    pagination: PaginationParams,
    tag?: string,
  ): Promise<ImageListResult> {
    const where: Prisma.ImageWhereInput = {
      serviceOrderId: null,
      ...(tag === undefined ? {} : { tag }),
    };

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.image.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prismaService.image.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Image | null> {
    return this.prismaService.image.findUnique({ where: { id } });
  }

  async remove(id: string): Promise<Image> {
    return this.prismaService.image.delete({ where: { id } });
  }
}
