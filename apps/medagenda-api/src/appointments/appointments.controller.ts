import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { AppointmentsService } from './appointments.service';

class CreateAppointmentDto {
  @IsUUID('4', { message: 'Médico inválido' })
  doctorId!: string;

  @IsUUID('4', { message: 'Paciente inválido' })
  patientId!: string;

  @IsISO8601({}, { message: 'startsAt deve ser uma data/hora ISO 8601' })
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;
}

class CancelAppointmentDto {
  @IsString()
  @Length(3, 300, { message: 'Motivo deve ter entre 3 e 300 caracteres' })
  reason!: string;
}

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointments.list({ doctorId, patientId, status, from, to });
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointments.get(id);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.appointments.create(dto, user.sub);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointments.cancel(id, dto.reason, user.sub);
  }
}
