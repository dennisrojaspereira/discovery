import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface PatientInput {
  name?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
}

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(search?: string) {
    const where: Prisma.PatientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.patient.findMany({ where, orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async create(
    data: Required<Omit<PatientInput, never>>,
    userId: string,
  ) {
    const birthDate = this.parseBirthDate(data.birthDate);
    try {
      const patient = await this.prisma.patient.create({
        data: { ...data, birthDate },
      });
      await this.audit.record({
        userId,
        action: 'PATIENT_CREATED',
        entity: 'Patient',
        entityId: patient.id,
        // Auditoria não guarda dados pessoais além do id
        payload: {},
      });
      return patient;
    } catch (err) {
      this.rethrowUnique(err);
      throw err;
    }
  }

  async update(id: string, data: PatientInput, userId: string) {
    await this.get(id);
    const birthDate = data.birthDate
      ? this.parseBirthDate(data.birthDate)
      : undefined;
    try {
      const patient = await this.prisma.patient.update({
        where: { id },
        data: { ...data, birthDate },
      });
      await this.audit.record({
        userId,
        action: 'PATIENT_UPDATED',
        entity: 'Patient',
        entityId: id,
        payload: { fields: Object.keys(data) },
      });
      return patient;
    } catch (err) {
      this.rethrowUnique(err);
      throw err;
    }
  }

  private parseBirthDate(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date >= new Date()) {
      throw new BadRequestException(
        'Data de nascimento inválida ou no futuro',
      );
    }
    return date;
  }

  private rethrowUnique(err: unknown): void {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictException('Já existe um paciente com esse e-mail');
    }
  }
}
