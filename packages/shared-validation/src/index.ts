// ============================================================
// @medagenda/shared-validation — schemas Zod compartilhados
// Usados pelo frontend (formulários) e documentam o contrato da API.
// A API NestJS valida com class-validator; estes schemas espelham
// as mesmas regras para validação no cliente.
// ============================================================

import { z } from 'zod';

// ---------- Helpers ----------

/** HH:mm 24h */
export const timeHHmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário deve estar no formato HH:mm');

export const ufSchema = z
  .string()
  .length(2, 'UF deve ter 2 letras')
  .regex(/^[A-Z]{2}$/, 'UF deve conter apenas letras maiúsculas');

/** Telefone fictício BR: (99) 99999-9999 ou dígitos */
export const phoneSchema = z
  .string()
  .min(8, 'Telefone muito curto')
  .max(20, 'Telefone muito longo')
  .regex(/^[\d\s()+-]+$/, 'Telefone contém caracteres inválidos');

// ---------- Auth ----------

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Especialidades ----------

export const createSpecialtySchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(80),
  description: z.string().max(300).optional(),
});
export type CreateSpecialtyInput = z.infer<typeof createSpecialtySchema>;

// ---------- Médicos ----------

export const createDoctorSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(120),
  crm: z
    .string()
    .regex(/^\d{4,7}$/, 'CRM fictício deve ter de 4 a 7 dígitos'),
  crmUf: ufSchema,
  specialtyId: z.string().uuid('Especialidade inválida'),
  phone: phoneSchema,
  email: z.string().email('E-mail inválido'),
});
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = createDoctorSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

// ---------- Pacientes ----------

export const createPatientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(120),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')
    .refine((d) => {
      const date = new Date(`${d}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date < new Date();
    }, 'Data de nascimento deve ser no passado'),
  phone: phoneSchema,
  email: z.string().email('E-mail inválido'),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// ---------- Disponibilidade ----------

export const createAvailabilityRuleSchema = z
  .object({
    doctorId: z.string().uuid(),
    weekday: z.number().int().min(0).max(6),
    startTime: timeHHmm,
    endTime: timeHHmm,
    slotDurationMin: z.number().int().min(10).max(240),
    bufferMin: z.number().int().min(0).max(60),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: 'Horário inicial deve ser antes do final',
    path: ['endTime'],
  });
export type CreateAvailabilityRuleInput = z.infer<
  typeof createAvailabilityRuleSchema
>;

export const createAvailabilityBlockSchema = z
  .object({
    doctorId: z.string().uuid(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    reason: z.string().max(200).optional(),
  })
  .refine((v) => new Date(v.startsAt) < new Date(v.endsAt), {
    message: 'Início do bloqueio deve ser antes do fim',
    path: ['endsAt'],
  });
export type CreateAvailabilityBlockInput = z.infer<
  typeof createAvailabilityBlockSchema
>;

// ---------- Agendamento ----------

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('Médico inválido'),
  patientId: z.string().uuid('Paciente inválido'),
  startsAt: z.string().datetime({ offset: true }),
  /** chave de idempotência opcional enviada pelo cliente */
  idempotencyKey: z.string().max(100).optional(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(3).max(300),
});
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
