import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  softDelete(userId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await transaction.session.deleteMany({ where: { userId } });
      return result.count;
    });
  }
}
