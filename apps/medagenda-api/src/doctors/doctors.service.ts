import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(params: { specialtyId?: string; status?: string; search?: string }) {
    const where: Prisma.DoctorWhereInput = {};
    if (params.specialtyId) where.specialtyId = params.specialtyId;
    if (params.status === 'ACTIVE' || params.status === 'INACTIVE') {
      where.status = params.status;
    }
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }
    return this.prisma.doctor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { specialty: true },
    });
  }

  async get(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: { specialty: true, availabilityRules: true },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    return doctor;
  }

  async create(dto: CreateDoctorDto, userId: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });
    if (!specialty) throw new BadRequestException('Especialidade inexistente');

    try {
      const doctor = await this.prisma.doctor.create({
        data: { ...dto },
        include: { specialty: true },
      });
      await this.audit.record({
        userId,
        action: 'DOCTOR_CREATED',
        entity: 'Doctor',
        entityId: doctor.id,
        payload: { name: doctor.name, crm: doctor.crm, crmUf: doctor.crmUf },
      });
      return doctor;
    } catch (err) {
      this.rethrowUnique(err);
      throw err;
    }
  }

  async update(id: string, dto: UpdateDoctorDto, userId: string) {
    await this.get(id);
    if (dto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: dto.specialtyId },
      });
      if (!specialty) throw new BadRequestException('Especialidade inexistente');
    }
    try {
      const doctor = await this.prisma.doctor.update({
        where: { id },
        data: { ...dto },
        include: { specialty: true },
      });
      await this.audit.record({
        userId,
        action:
          dto.status === 'INACTIVE' ? 'DOCTOR_DEACTIVATED' : 'DOCTOR_UPDATED',
        entity: 'Doctor',
        entityId: id,
        payload: { changes: { ...dto } },
      });
      return doctor;
    } catch (err) {
      this.rethrowUnique(err);
      throw err;
    }
  }

  /** Desativação lógica — mantém histórico de consultas */
  async deactivate(id: string, userId: string) {
    return this.update(id, { status: 'INACTIVE' }, userId);
  }

  private rethrowUnique(err: unknown): void {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      if (target.includes('email')) {
        throw new ConflictException('Já existe um médico com esse e-mail');
      }
      throw new ConflictException('Já existe um médico com esse CRM/UF');
    }
  }
}
