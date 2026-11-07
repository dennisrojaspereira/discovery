import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import {
  createTestApp,
  loginAsAdmin,
  resetDatabase,
  seedBaseData,
  tomorrowAt,
} from './helpers';

describe('MedAgenda API — agendamentos e conflitos de horário (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let doctorId: string;
  let patientId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    const base = await seedBaseData(prisma);
    doctorId = base.doctor.id;
    patientId = base.patient.id;
    token = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const book = (startsAt: Date, idempotencyKey?: string) =>
    request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId,
        patientId,
        startsAt: startsAt.toISOString(),
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });

  it('agenda uma consulta em slot válido', async () => {
    const res = await book(tomorrowAt(8, 0)).expect(201);
    expect(res.body.status).toBe('SCHEDULED');
    expect(res.body.doctor.name).toBe('Dra. Teste');
    expect(res.body.patient.name).toBe('Paciente Teste');
  });

  it('rejeita horário fora da grade de slots com 400', async () => {
    await book(tomorrowAt(8, 10)).expect(400); // 08:10 não é slot de 30min
  });

  it('rejeita agendamento no passado com 400', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    past.setHours(9, 0, 0, 0);
    await book(past).expect(400);
  });

  it('rejeita segundo agendamento no mesmo horário com 409', async () => {
    await book(tomorrowAt(9, 0)).expect(201);
    await book(tomorrowAt(9, 0)).expect(409);
  });

  it('CONCORRÊNCIA: 5 requisições simultâneas para o mesmo slot => exatamente 1 sucesso', async () => {
    const slot = tomorrowAt(10, 0);
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => book(slot)),
    );
    const statuses = results.map((r) =>
      r.status === 'fulfilled' ? r.value.status : 0,
    );
    const created = statuses.filter((s) => s === 201).length;
    const conflicts = statuses.filter((s) => s === 409).length;
    expect(created).toBe(1);
    expect(conflicts).toBe(4);

    // Confirma no banco: apenas 1 consulta SCHEDULED nesse horário
    const count = await prisma.appointment.count({
      where: { doctorId, startsAt: slot, status: 'SCHEDULED' },
    });
    expect(count).toBe(1);
  });

  it('IDEMPOTÊNCIA: mesma idempotencyKey retorna a mesma consulta', async () => {
    const key = 'teste-idempotencia-001';
    const first = await book(tomorrowAt(11, 0), key).expect(201);
    const second = await book(tomorrowAt(11, 0), key).expect(201);
    expect(second.body.id).toBe(first.body.id);

    const count = await prisma.appointment.count({
      where: { idempotencyKey: key },
    });
    expect(count).toBe(1);
  });

  it('cancela consulta e impede cancelamento duplicado', async () => {
    const created = await book(tomorrowAt(14, 0)).expect(201);
    const id = created.body.id as string;

    const cancelled = await request(app.getHttpServer())
      .post(`/api/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Paciente desmarcou por telefone' })
      .expect(201);
    expect(cancelled.body.status).toBe('CANCELLED');
    expect(cancelled.body.cancelReason).toBe('Paciente desmarcou por telefone');

    await request(app.getHttpServer())
      .post(`/api/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'De novo' })
      .expect(400);
  });

  it('slot cancelado volta a ficar disponível para novo agendamento', async () => {
    const slot = tomorrowAt(15, 0);
    const created = await book(slot).expect(201);
    await request(app.getHttpServer())
      .post(`/api/appointments/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Liberando horário' })
      .expect(201);

    // Mesmo horário pode ser reagendado (constraint só vale para SCHEDULED)
    await book(slot).expect(201);
  });

  it('rejeita agendamento em horário bloqueado com 409', async () => {
    const blockStart = tomorrowAt(16, 0);
    const blockEnd = tomorrowAt(17, 0);
    await request(app.getHttpServer())
      .post('/api/availability/blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId,
        startsAt: blockStart.toISOString(),
        endsAt: blockEnd.toISOString(),
        reason: 'Congresso médico',
      })
      .expect(201);

    await book(tomorrowAt(16, 0)).expect(409);
    await book(tomorrowAt(16, 30)).expect(409);
  });

  it('registra auditoria das operações de agendamento', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { entity: 'Appointment' },
    });
    const actions = new Set(logs.map((l) => l.action));
    expect(actions.has('APPOINTMENT_CREATED')).toBe(true);
    expect(actions.has('APPOINTMENT_CANCELLED')).toBe(true);
  });
});
