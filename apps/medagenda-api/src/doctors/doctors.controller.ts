import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Get()
  list(
    @Query('specialtyId') specialtyId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.doctors.list({ specialtyId, status, search });
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctors.get(id);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post()
  create(@Body() dto: CreateDoctorDto, @CurrentUser() user: JwtPayload) {
    return this.doctors.create(dto, user.sub);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.doctors.update(id, dto, user.sub);
  }

  /** Desativação lógica (não exclui o registro) */
  @Roles('ADMIN')
  @Delete(':id')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.doctors.deactivate(id, user.sub);
  }
}
