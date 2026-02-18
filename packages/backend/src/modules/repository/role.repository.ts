import { Injectable } from '@nestjs/common';
import { UserRoles } from '../../enums';
import { prisma } from '../prisma/prisma.client';

@Injectable()
export class RoleRepository {
  public async findRoleInApp(user_id: string, client_id: string): Promise<UserRoles> {
    if (!user_id) return undefined;

    const role = await prisma.role.findUnique({
      where: { user_id_client_id: { user_id: parseInt(user_id, 10), client_id } },
      select: {
        role: true,
      },
    });

    return role?.role as UserRoles;
  }
}
