import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma operação de auditoria. Nunca derruba a operação principal:
   * falha de auditoria é logada, não propagada.
   */
  async record(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    payload?: Prisma.InputJsonValue;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          payload: params.payload,
        },
      });
    } catch (err) {
      this.logger.error(`Falha ao gravar auditoria ${params.action}`, err);
    }
  }

  list(params: { entity?: string; entityId?: string; take?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        entity: params.entity,
        entityId: params.entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: params.take ?? 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
