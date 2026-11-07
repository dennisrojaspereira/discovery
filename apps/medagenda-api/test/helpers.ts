import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TEST_DATABASE_URL } from './global-setup';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaClient;
}> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'test-secret';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });
  return { app, prisma };
}

/** Limpa todas as tabelas (ordem respeita FKs) */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedBaseData(prisma: PrismaClient) {
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Teste',
      email: 'admin@test.local',
      passwordHash: hashSync('admin123', 4),
      role: 'ADMIN',
    },
  });
  const specialty = await prisma.specialty.create({
    data: { name: 'Cardiologia', description: 'Teste' },
  });
  const doctor = await prisma.doctor.create({
    data: {
      name: 'Dra. Teste',
      crm: '111222',
      crmUf: 'SP',
      specialtyId: specialty.id,
      phone: '(11) 90000-0000',
      email: 'dra.teste@test.local',
    },
  });
  const patient = await prisma.patient.create({
    data: {
      name: 'Paciente Teste',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phone: '(11) 91111-1111',
      email: 'paciente@test.local',
    },
  });
  // Atende todos os dias (0-6) para os testes não dependerem do dia atual
  for (let weekday = 0; weekday <= 6; weekday++) {
    await prisma.availabilityRule.create({
      data: {
        doctorId: doctor.id,
        weekday,
        startTime: '08:00',
        endTime: '18:00',
        slotDurationMin: 30,
        bufferMin: 0,
      },
    });
  }
  return { admin, specialty, doctor, patient };
}

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: 'admin@test.local', password: 'admin123' })
    .expect(200);
  return res.body.accessToken as string;
}

/** Próximo dia às HH:mm locais (sempre no futuro) */
export function tomorrowAt(hours: number, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
