import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AvailabilityService } from '../availability/availability.service';

const APPOINTMENT_INCLUDE = {
  doctor: { include: { specialty: true } },
  patient: true,
} as const;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly availability: AvailabilityService,
  ) {}

  list(params: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const where: Prisma.AppointmentWhereInput = {};
    if (params.doctorId) where.doctorId = params.doctorId;
    if (params.patientId) where.patientId = params.patientId;
    if (
      params.status &&
      ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(params.status)
    ) {
      where.status = params.status as Prisma.EnumAppointmentStatusFilter['equals'];
    }
    if (params.from || params.to) {
      where.startsAt = {};
      if (params.from) where.startsAt.gte = new Date(params.from);
      if (params.to) where.startsAt.lt = new Date(params.to);
    }
    return this.prisma.appointment.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: APPOINTMENT_INCLUDE,
    });
  }

  async get(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });
    if (!appointment) throw new NotFoundException('Consulta não encontrada');
    return appointment;
  }

  /**
   * Agendamento com três camadas de proteção contra conflito:
   *  1. validação do slot contra as regras de disponibilidade;
   *  2. checagem transacional de sobreposição (SELECT dentro da transação);
   *  3. EXCLUSION CONSTRAINT no PostgreSQL (btree_gist) como garantia final —
   *     mesmo sob concorrência, o banco rejeita o segundo INSERT sobreposto.
   * Idempotência: `idempotencyKey` única; reenvio da mesma chave retorna a
   * consulta já criada em vez de duplicar.
   */
  async create(
    data: {
      doctorId: string;
      patientId: string;
      startsAt: string;
      idempotencyKey?: string;
    },
    userId: string,
  ) {
    const startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Data/hora inválida');
    }
    if (startsAt <= new Date()) {
      throw new BadRequestException('Agendamento deve ser no futuro');
    }

    // Idempotência: mesma chave => mesma consulta, sem duplicar
    if (data.idempotencyKey) {
      const existing = await this.prisma.appointment.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: APPOINTMENT_INCLUDE,
      });
      if (existing) return existing;
    }

    const [doctor, patient] = await Promise.all([
      this.prisma.doctor.findUnique({ where: { id: data.doctorId } }),
      this.prisma.patient.findUnique({ where: { id: data.patientId } }),
    ]);
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    if (doctor.status !== 'ACTIVE') {
      throw new BadRequestException('Médico está inativo');
    }
    if (!patient) throw new NotFoundException('Paciente não encontrado');

    // Camada 1: o horário precisa ser um slot válido das regras do médico
    const endsAt = await this.availability.resolveSlotEnd(
      data.doctorId,
      startsAt,
    );

    if (await this.availability.hasBlockOverlap(data.doctorId, startsAt, endsAt)) {
      throw new ConflictException('A agenda do médico está bloqueada neste horário');
    }

    try {
      const appointment = await this.prisma.$transaction(async (tx) => {
        // Camada 2: checagem de sobreposição dentro da transação
        const overlapping = await tx.appointment.count({
          where: {
            doctorId: data.doctorId,
            status: 'SCHEDULED',
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });
        if (overlapping > 0) {
          throw new ConflictException('Horário já ocupado para este médico');
        }
        return tx.appointment.create({
          data: {
            doctorId: data.doctorId,
            patientId: data.patientId,
            startsAt,
            endsAt,
            idempotencyKey: data.idempotencyKey,
          },
          include: APPOINTMENT_INCLUDE,
        });
      });

      await this.audit.record({
        userId,
        action: 'APPOINTMENT_CREATED',
        entity: 'Appointment',
        entityId: appointment.id,
        payload: {
          doctorId: data.doctorId,
          patientId: data.patientId,
          startsAt: startsAt.toISOString(),
        },
      });
      return appointment;
    } catch (err) {
      // Camada 3: violação da exclusion constraint do Postgres (23P01)
      if (this.isExclusionViolation(err)) {
        throw new ConflictException('Horário já ocupado para este médico');
      }
      // Corrida na idempotencyKey única: outra requisição criou primeiro
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        data.idempotencyKey
      ) {
        const existing = await this.prisma.appointment.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: APPOINTMENT_INCLUDE,
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async cancel(id: string, reason: string, userId: string) {
    const appointment = await this.get(id);
    if (appointment.status !== 'SCHEDULED') {
      throw new BadRequestException(
        `Só é possível cancelar consultas agendadas (status atual: ${appointment.status})`,
      );
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        cancelledAt: new Date(),
      },
      include: APPOINTMENT_INCLUDE,
    });

    await this.audit.record({
      userId,
      action: 'APPOINTMENT_CANCELLED',
      entity: 'Appointment',
      entityId: id,
      payload: { reason },
    });
    return cancelled;
  }

  private isExclusionViolation(err: unknown): boolean {
    // Prisma repassa erros não mapeados do PG; 23P01 = exclusion_violation
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : '';
    return (
      message.includes('23P01') ||
      message.includes('appointments_no_overlap') ||
      message.includes('conflicting key value violates exclusion constraint')
    );
  }
}
