import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import {
  createTestApp,
  loginAsAdmin,
  resetDatabase,
  seedBaseData,
} from './helpers';

describe('MedAgenda API — autenticação e CRUDs (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let specialtyId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    const base = await seedBaseData(prisma);
    specialtyId = base.specialty.id;
    token = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('health', () => {
    it('GET /api/health responde ok sem autenticação', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.db).toBe('up');
    });
  });

  describe('auth', () => {
    it('login com credenciais válidas retorna token e usuário', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.local', password: 'admin123' })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('login com senha errada retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.local', password: 'errada123' })
        .expect(401);
    });

    it('rota protegida sem token retorna 401', async () => {
      await request(app.getHttpServer()).get('/api/doctors').expect(401);
    });

    it('GET /api/auth/me retorna o usuário autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.email).toBe('admin@test.local');
    });
  });

  describe('specialties', () => {
    it('cria e lista especialidades', async () => {
      await request(app.getHttpServer())
        .post('/api/specialties')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ortopedia', description: 'Teste e2e' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/specialties')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const names = res.body.map((s: { name: string }) => s.name);
      expect(names).toContain('Ortopedia');
    });

    it('rejeita especialidade duplicada com 409', async () => {
      await request(app.getHttpServer())
        .post('/api/specialties')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cardiologia' })
        .expect(409);
    });
  });

  describe('doctors', () => {
    it('cria, edita e desativa um médico', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/doctors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Dr. CRUD Teste',
          crm: '999888',
          crmUf: 'SP',
          specialtyId,
          phone: '(11) 95555-5555',
          email: 'dr.crud@test.local',
        })
        .expect(201);
      const doctorId = created.body.id as string;
      expect(created.body.status).toBe('ACTIVE');

      const updated = await request(app.getHttpServer())
        .patch(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '(11) 95555-6666' })
        .expect(200);
      expect(updated.body.phone).toBe('(11) 95555-6666');

      const deactivated = await request(app.getHttpServer())
        .delete(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(deactivated.body.status).toBe('INACTIVE');
    });

    it('rejeita CRM inválido com 400', async () => {
      await request(app.getHttpServer())
        .post('/api/doctors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Dr. Inválido',
          crm: 'ABC',
          crmUf: 'SP',
          specialtyId,
          phone: '(11) 95555-5555',
          email: 'dr.invalido@test.local',
        })
        .expect(400);
    });
  });

  describe('patients', () => {
    it('cria e edita um paciente', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Paciente CRUD',
          birthDate: '1988-04-15',
          phone: '(11) 97777-7777',
          email: 'paciente.crud@test.local',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/patients/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '(11) 97777-8888' })
        .expect(200);
    });

    it('rejeita data de nascimento no futuro', async () => {
      await request(app.getHttpServer())
        .post('/api/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Paciente Futuro',
          birthDate: '2099-01-01',
          phone: '(11) 90000-0001',
          email: 'futuro@test.local',
        })
        .expect(400);
    });
  });

  describe('availability', () => {
    it('lista slots calculados a partir das regras', async () => {
      const doctor = await prisma.doctor.findFirstOrThrow({
        where: { email: 'dra.teste@test.local' },
      });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const res = await request(app.getHttpServer())
        .get(`/api/availability/slots?doctorId=${doctor.id}&date=${dateStr}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      // 08:00–18:00, 30min => 20 slots
      expect(res.body.length).toBe(20);
      expect(res.body[0].available).toBeDefined();
    });
  });
});
