import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async softDelete(userId: string) {
    if (!(await this.repository.softDelete(userId))) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return { success: true };
  }
}
