/* eslint-disable no-console */
// Seed do MedAgenda — SOMENTE dados sintéticos/fictícios.
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ---------- Usuários do sistema ----------
  const users = [
    {
      name: 'Administrador',
      email: 'admin@medagenda.local',
      password: 'admin123',
      role: 'ADMIN' as const,
    },
    {
      name: 'Fernanda Recepção',
      email: 'recepcao@medagenda.local',
      password: 'recepcao123',
      role: 'RECEPCAO' as const,
    },
    {
      name: 'Dra. Helena Souza',
      email: 'medico@medagenda.local',
      password: 'medico123',
      role: 'MEDICO' as const,
    },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash: hashSync(u.password, 10),
        role: u.role,
      },
    });
  }

  // ---------- Especialidades ----------
  const specialtyNames = [
    ['Cardiologia', 'Doenças do coração e do sistema circulatório'],
    ['Dermatologia', 'Doenças da pele, cabelos e unhas'],
    ['Pediatria', 'Saúde de crianças e adolescentes'],
    ['Clínica Geral', 'Atendimento clínico geral e preventivo'],
    ['Ortopedia', 'Sistema musculoesquelético'],
  ] as const;
  const specialties: Record<string, string> = {};
  for (const [name, description] of specialtyNames) {
    const s = await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name, description },
    });
    specialties[name] = s.id;
  }

  // ---------- Médicos (fictícios) ----------
  const doctorsData = [
    {
      name: 'Dra. Helena Souza',
      crm: '123456',
      crmUf: 'SP',
      specialty: 'Cardiologia',
      phone: '(11) 99999-0001',
      email: 'helena.souza@medagenda.local',
    },
    {
      name: 'Dr. Carlos Lima',
      crm: '234567',
      crmUf: 'SP',
      specialty: 'Dermatologia',
      phone: '(11) 99999-0002',
      email: 'carlos.lima@medagenda.local',
    },
    {
      name: 'Dra. Paula Andrade',
      crm: '345678',
      crmUf: 'RJ',
      specialty: 'Pediatria',
      phone: '(21) 99999-0003',
      email: 'paula.andrade@medagenda.local',
    },
    {
      name: 'Dr. Miguel Ferreira',
      crm: '456789',
      crmUf: 'SP',
      specialty: 'Clínica Geral',
      phone: '(11) 99999-0004',
      email: 'miguel.ferreira@medagenda.local',
    },
  ];
  const doctorIds: string[] = [];
  for (const d of doctorsData) {
    const doctor = await prisma.doctor.upsert({
      where: { email: d.email },
      update: {},
      create: {
        name: d.name,
        crm: d.crm,
        crmUf: d.crmUf,
        specialtyId: specialties[d.specialty],
        phone: d.phone,
        email: d.email,
      },
    });
    doctorIds.push(doctor.id);
  }

  // ---------- Pacientes (fictícios) ----------
  const patientsData = [
    { name: 'João Pereira', birthDate: '1985-03-12', phone: '(11) 98888-0001', email: 'joao.pereira@exemplo.local' },
    { name: 'Maria Oliveira', birthDate: '1990-07-25', phone: '(11) 98888-0002', email: 'maria.oliveira@exemplo.local' },
    { name: 'Pedro Santos', birthDate: '1978-11-02', phone: '(11) 98888-0003', email: 'pedro.santos@exemplo.local' },
    { name: 'Ana Costa', birthDate: '2001-01-18', phone: '(21) 98888-0004', email: 'ana.costa@exemplo.local' },
    { name: 'Lucia Mendes', birthDate: '1965-09-30', phone: '(11) 98888-0005', email: 'lucia.mendes@exemplo.local' },
    { name: 'Rafael Rocha', birthDate: '1995-05-07', phone: '(11) 98888-0006', email: 'rafael.rocha@exemplo.local' },
  ];
  const patientIds: string[] = [];
  for (const p of patientsData) {
    const patient = await prisma.patient.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        birthDate: new Date(`${p.birthDate}T00:00:00.000Z`),
        phone: p.phone,
        email: p.email,
      },
    });
    patientIds.push(patient.id);
  }

  // ---------- Disponibilidade: seg-sex para todos os médicos ----------
  for (const doctorId of doctorIds) {
    for (const weekday of [1, 2, 3, 4, 5]) {
      await prisma.availabilityRule.upsert({
        where: {
          doctorId_weekday_startTime: { doctorId, weekday, startTime: '09:00' },
        },
        update: {},
        create: {
          doctorId,
          weekday,
          startTime: '09:00',
          endTime: '12:00',
          slotDurationMin: 30,
          bufferMin: 0,
        },
      });
      await prisma.availabilityRule.upsert({
        where: {
          doctorId_weekday_startTime: { doctorId, weekday, startTime: '14:00' },
        },
        update: {},
        create: {
          doctorId,
          weekday,
          startTime: '14:00',
          endTime: '17:00',
          slotDurationMin: 30,
          bufferMin: 0,
        },
      });
    }
  }

  // ---------- Consultas de exemplo (próximo dia útil) ----------
  const nextBusinessDay = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const mkSlot = (base: Date, hours: number, minutes: number) => {
    const s = new Date(base);
    s.setHours(hours, minutes, 0, 0);
    return s;
  };

  const sampleAppointments = [
    { doctor: 0, patient: 0, h: 9, m: 0 },
    { doctor: 0, patient: 1, h: 9, m: 30 },
    { doctor: 1, patient: 2, h: 14, m: 0 },
    { doctor: 2, patient: 3, h: 10, m: 0 },
  ];
  for (const a of sampleAppointments) {
    const startsAt = mkSlot(nextBusinessDay, a.h, a.m);
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
    const existing = await prisma.appointment.findFirst({
      where: { doctorId: doctorIds[a.doctor], startsAt, status: 'SCHEDULED' },
    });
    if (!existing) {
      await prisma.appointment.create({
        data: {
          doctorId: doctorIds[a.doctor],
          patientId: patientIds[a.patient],
          startsAt,
          endsAt,
        },
      });
    }
  }

  // Uma consulta cancelada (histórico para o dashboard)
  const cancelledStart = mkSlot(nextBusinessDay, 15, 0);
  const existingCancelled = await prisma.appointment.findFirst({
    where: { doctorId: doctorIds[3], startsAt: cancelledStart },
  });
  if (!existingCancelled) {
    await prisma.appointment.create({
      data: {
        doctorId: doctorIds[3],
        patientId: patientIds[4],
        startsAt: cancelledStart,
        endsAt: new Date(cancelledStart.getTime() + 30 * 60_000),
        status: 'CANCELLED',
        cancelReason: 'Paciente avisou que não poderá comparecer',
        cancelledAt: new Date(),
      },
    });
  }

  console.log('Seed concluído: usuários, especialidades, médicos, pacientes, disponibilidade e consultas de exemplo.');
  console.log('Logins: admin@medagenda.local/admin123 | recepcao@medagenda.local/recepcao123 | medico@medagenda.local/medico123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
