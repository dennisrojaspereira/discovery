import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** Trilha de auditoria — somente administradores */
  @Roles('ADMIN')
  @Get()
  list(
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.audit.list({ entity, entityId });
  }
}
