import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SpecialtiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { doctors: true } } },
    });
  }

  async get(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });
    if (!specialty) throw new NotFoundException('Especialidade não encontrada');
    return specialty;
  }

  async create(
    data: { name: string; description?: string },
    userId: string,
  ) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Já existe uma especialidade com esse nome');
    }
    const specialty = await this.prisma.specialty.create({ data });
    await this.audit.record({
      userId,
      action: 'SPECIALTY_CREATED',
      entity: 'Specialty',
      entityId: specialty.id,
      payload: { name: specialty.name },
    });
    return specialty;
  }
}
