// ============================================================
// @medagenda/shared-types — tipos compartilhados entre API e Web
// ============================================================

export type UUID = string;

// ---------- Enums (espelham o schema Prisma) ----------

export enum UserRole {
  ADMIN = 'ADMIN',
  RECEPCAO = 'RECEPCAO',
  MEDICO = 'MEDICO',
}

export enum DoctorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/** Dia da semana: 0 = domingo ... 6 = sábado (convenção JS Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ---------- Entidades ----------

export interface Specialty {
  id: UUID;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: UUID;
  name: string;
  crm: string;
  crmUf: string;
  specialtyId: UUID;
  specialty?: Specialty;
  phone: string;
  email: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: UUID;
  name: string;
  birthDate: string; // ISO date (yyyy-mm-dd)
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/** Regra recorrente de atendimento de um médico */
export interface AvailabilityRule {
  id: UUID;
  doctorId: UUID;
  weekday: Weekday;
  /** "HH:mm" início do expediente */
  startTime: string;
  /** "HH:mm" fim do expediente */
  endTime: string;
  /** duração da consulta em minutos */
  slotDurationMin: number;
  /** intervalo entre consultas em minutos */
  bufferMin: number;
  createdAt: string;
  updatedAt: string;
}

/** Bloqueio pontual de agenda (férias, congresso, imprevisto) */
export interface AvailabilityBlock {
  id: UUID;
  doctorId: UUID;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  reason?: string | null;
  createdAt: string;
}

export interface Appointment {
  id: UUID;
  doctorId: UUID;
  doctor?: Doctor;
  patientId: UUID;
  patient?: Patient;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  status: AppointmentStatus;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- API: autenticação ----------

export interface AuthUser {
  id: UUID;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ---------- API: slots e dashboard ----------

/** Slot calculado a partir das regras de disponibilidade */
export interface TimeSlot {
  doctorId: UUID;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface DashboardSummary {
  todayAppointments: Appointment[];
  todayCount: number;
  activeDoctors: number;
  upcomingAppointments: Appointment[];
  cancelledThisWeek: number;
  availableSlotsToday: number;
}

// ---------- API: respostas paginadas e erros ----------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
