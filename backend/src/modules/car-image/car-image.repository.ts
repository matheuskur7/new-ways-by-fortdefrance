import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';
import type { CarImage, Prisma } from '../../generated/prisma/client.js';
import type { PaginationParams } from '../../shared/pagination/pagination.js';

type CarImageListResult = {
  data: CarImage[];
  total: number;
};

@Injectable()
export class CarImageRepository {
  constructor(private prismaService: PrismaService) {}

  async create(key: string): Promise<CarImage> {
    return this.prismaService.carImage.create({ data: { key } });
  }

  async findAll(pagination: PaginationParams): Promise<CarImageListResult> {
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.carImage.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prismaService.carImage.count(),
    ]);

    return { data, total };
  }

  async findAllUnlinked(
    pagination: PaginationParams,
  ): Promise<CarImageListResult> {
    const where: Prisma.CarImageWhereInput = {
      serviceOrderId: null,
    };

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.carImage.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prismaService.carImage.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<CarImage | null> {
    return this.prismaService.carImage.findUnique({ where: { id } });
  }

  async remove(id: string): Promise<CarImage> {
    return this.prismaService.carImage.delete({ where: { id } });
  }
}
