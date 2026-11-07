import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface SlotView {
  doctorId: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

/** Converte "HH:mm" em minutos desde 00:00 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Cria um Date local a partir de uma data (yyyy-mm-dd) e minutos do dia */
export function localDateAt(dateStr: string, minutes: number): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------- Regras recorrentes ----------

  listRules(doctorId?: string) {
    return this.prisma.availabilityRule.findMany({
      where: doctorId ? { doctorId } : undefined,
      orderBy: [{ doctorId: 'asc' }, { weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createRule(
    data: {
      doctorId: string;
      weekday: number;
      startTime: string;
      endTime: string;
      slotDurationMin: number;
      bufferMin: number;
    },
    userId: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: data.doctorId },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    if (timeToMinutes(data.startTime) >= timeToMinutes(data.endTime)) {
      throw new BadRequestException('Horário inicial deve ser antes do final');
    }

    // Impede regras sobrepostas no mesmo dia da semana
    const sameDay = await this.prisma.availabilityRule.findMany({
      where: { doctorId: data.doctorId, weekday: data.weekday },
    });
    const newStart = timeToMinutes(data.startTime);
    const newEnd = timeToMinutes(data.endTime);
    for (const rule of sameDay) {
      const start = timeToMinutes(rule.startTime);
      const end = timeToMinutes(rule.endTime);
      if (newStart < end && newEnd > start) {
        throw new ConflictException(
          `Conflita com a regra existente ${rule.startTime}–${rule.endTime}`,
        );
      }
    }

    const rule = await this.prisma.availabilityRule.create({ data });
    await this.audit.record({
      userId,
      action: 'AVAILABILITY_RULE_CREATED',
      entity: 'AvailabilityRule',
      entityId: rule.id,
      payload: { ...data },
    });
    return rule;
  }

  async deleteRule(id: string, userId: string) {
    const rule = await this.prisma.availabilityRule.findUnique({
      where: { id },
    });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    await this.prisma.availabilityRule.delete({ where: { id } });
    await this.audit.record({
      userId,
      action: 'AVAILABILITY_RULE_DELETED',
      entity: 'AvailabilityRule',
      entityId: id,
    });
    return { deleted: true };
  }

  // ---------- Bloqueios pontuais ----------

  listBlocks(doctorId?: string) {
    return this.prisma.availabilityBlock.findMany({
      where: doctorId ? { doctorId } : undefined,
      orderBy: { startsAt: 'asc' },
    });
  }

  async createBlock(
    data: { doctorId: string; startsAt: string; endsAt: string; reason?: string },
    userId: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: data.doctorId },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    if (startsAt >= endsAt) {
      throw new BadRequestException('Início do bloqueio deve ser antes do fim');
    }

    const block = await this.prisma.availabilityBlock.create({
      data: { doctorId: data.doctorId, startsAt, endsAt, reason: data.reason },
    });
    await this.audit.record({
      userId,
      action: 'AVAILABILITY_BLOCK_CREATED',
      entity: 'AvailabilityBlock',
      entityId: block.id,
      payload: { doctorId: data.doctorId, reason: data.reason ?? null },
    });
    return block;
  }

  async deleteBlock(id: string, userId: string) {
    const block = await this.prisma.availabilityBlock.findUnique({
      where: { id },
    });
    if (!block) throw new NotFoundException('Bloqueio não encontrado');
    await this.prisma.availabilityBlock.delete({ where: { id } });
    await this.audit.record({
      userId,
      action: 'AVAILABILITY_BLOCK_DELETED',
      entity: 'AvailabilityBlock',
      entityId: id,
    });
    return { deleted: true };
  }

  // ---------- Cálculo de slots ----------

  /**
   * Gera os slots de um médico em uma data, marcando como indisponíveis os
   * que colidem com consultas SCHEDULED ou bloqueios de agenda.
   */
  async slotsForDate(doctorId: string, dateStr: string): Promise<SlotView[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Data deve estar no formato AAAA-MM-DD');
    }
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');

    const dayStart = localDateAt(dateStr, 0);
    const dayEnd = localDateAt(dateStr, 24 * 60);
    const weekday = dayStart.getDay();

    const [rules, appointments, blocks] = await Promise.all([
      this.prisma.availabilityRule.findMany({
        where: { doctorId, weekday },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          status: 'SCHEDULED',
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
      }),
      this.prisma.availabilityBlock.findMany({
        where: { doctorId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      }),
    ]);

    const slots: SlotView[] = [];
    for (const rule of rules) {
      const start = timeToMinutes(rule.startTime);
      const end = timeToMinutes(rule.endTime);
      const step = rule.slotDurationMin + rule.bufferMin;
      for (let t = start; t + rule.slotDurationMin <= end; t += step) {
        const slotStart = localDateAt(dateStr, t);
        const slotEnd = new Date(
          slotStart.getTime() + rule.slotDurationMin * 60_000,
        );
        const busy =
          appointments.some(
            (a) => a.startsAt < slotEnd && a.endsAt > slotStart,
          ) || blocks.some((b) => b.startsAt < slotEnd && b.endsAt > slotStart);
        slots.push({
          doctorId,
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString(),
          available: !busy,
        });
      }
    }
    return slots;
  }

  /**
   * Valida se um horário proposto corresponde a um slot gerado pelas regras
   * do médico. Retorna o fim do slot (startsAt + duração da regra).
   */
  async resolveSlotEnd(doctorId: string, startsAt: Date): Promise<Date> {
    const weekday = startsAt.getDay();
    const rules = await this.prisma.availabilityRule.findMany({
      where: { doctorId, weekday },
    });
    if (rules.length === 0) {
      throw new BadRequestException(
        'Médico não atende neste dia da semana',
      );
    }

    const minutesOfDay = startsAt.getHours() * 60 + startsAt.getMinutes();
    for (const rule of rules) {
      const start = timeToMinutes(rule.startTime);
      const end = timeToMinutes(rule.endTime);
      const step = rule.slotDurationMin + rule.bufferMin;
      if (minutesOfDay < start || minutesOfDay + rule.slotDurationMin > end) {
        continue;
      }
      if (
        (minutesOfDay - start) % step === 0 &&
        startsAt.getSeconds() === 0 &&
        startsAt.getMilliseconds() === 0
      ) {
        return new Date(startsAt.getTime() + rule.slotDurationMin * 60_000);
      }
    }
    throw new BadRequestException(
      'Horário não corresponde a um slot válido da agenda do médico',
    );
  }

  /** Verifica se o intervalo colide com algum bloqueio de agenda */
  async hasBlockOverlap(
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean> {
    const count = await this.prisma.availabilityBlock.count({
      where: { doctorId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    return count > 0;
  }
}
