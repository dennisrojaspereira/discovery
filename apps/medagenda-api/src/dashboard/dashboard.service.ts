import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const weekStart = new Date(dayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const include = {
      doctor: { include: { specialty: true } },
      patient: true,
    } as const;

    const [
      todayAppointments,
      activeDoctors,
      upcomingAppointments,
      cancelledThisWeek,
    ] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          startsAt: { gte: dayStart, lt: dayEnd },
          status: { in: ['SCHEDULED', 'COMPLETED'] },
        },
        orderBy: { startsAt: 'asc' },
        include,
      }),
      this.prisma.doctor.count({ where: { status: 'ACTIVE' } }),
      this.prisma.appointment.findMany({
        where: { startsAt: { gte: now }, status: 'SCHEDULED' },
        orderBy: { startsAt: 'asc' },
        take: 8,
        include,
      }),
      this.prisma.appointment.count({
        where: { status: 'CANCELLED', cancelledAt: { gte: weekStart } },
      }),
    ]);

    // Slots livres hoje: total de slots das regras de hoje menos ocupados
    const availableSlotsToday = await this.countFreeSlotsToday(dayStart, dayEnd);

    return {
      todayAppointments,
      todayCount: todayAppointments.length,
      activeDoctors,
      upcomingAppointments,
      cancelledThisWeek,
      availableSlotsToday,
    };
  }

  private async countFreeSlotsToday(
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number> {
    const weekday = dayStart.getDay();
    const [rules, appointments, blocks] = await Promise.all([
      this.prisma.availabilityRule.findMany({
        where: { weekday, doctor: { status: 'ACTIVE' } },
      }),
      this.prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { doctorId: true, startsAt: true, endsAt: true },
      }),
      this.prisma.availabilityBlock.findMany({
        where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
        select: { doctorId: true, startsAt: true, endsAt: true },
      }),
    ]);

    let free = 0;
    const now = new Date();
    for (const rule of rules) {
      const [sh, sm] = rule.startTime.split(':').map(Number);
      const [eh, em] = rule.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      const step = rule.slotDurationMin + rule.bufferMin;
      for (let t = start; t + rule.slotDurationMin <= end; t += step) {
        const slotStart = new Date(dayStart);
        slotStart.setMinutes(t);
        const slotEnd = new Date(
          slotStart.getTime() + rule.slotDurationMin * 60_000,
        );
        if (slotEnd <= now) continue; // slot já passou
        const busy =
          appointments.some(
            (a) =>
              a.doctorId === rule.doctorId &&
              a.startsAt < slotEnd &&
              a.endsAt > slotStart,
          ) ||
          blocks.some(
            (b) =>
              b.doctorId === rule.doctorId &&
              b.startsAt < slotEnd &&
              b.endsAt > slotStart,
          );
        if (!busy) free += 1;
      }
    }
    return free;
  }
}
