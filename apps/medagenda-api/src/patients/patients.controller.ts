import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { PatientsService } from './patients.service';

class CreatePatientDto {
  @IsString()
  @Length(3, 120, { message: 'Nome deve ter entre 3 e 120 caracteres' })
  name!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data de nascimento deve estar no formato AAAA-MM-DD',
  })
  birthDate!: string;

  @Matches(/^[\d\s()+-]{8,20}$/, { message: 'Telefone inválido' })
  phone!: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;
}

class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  name?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;

  @IsOptional()
  @Matches(/^[\d\s()+-]{8,20}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Roles('ADMIN', 'RECEPCAO')
  @Get()
  list(@Query('search') search?: string) {
    return this.patients.list(search);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.patients.get(id);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post()
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: JwtPayload) {
    return this.patients.create(dto, user.sub);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patients.update(id, dto, user.sub);
  }
}
