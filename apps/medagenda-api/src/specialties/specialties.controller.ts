import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { SpecialtiesService } from './specialties.service';

class CreateSpecialtyDto {
  @IsString()
  @Length(3, 80, { message: 'Nome deve ter entre 3 e 80 caracteres' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialties: SpecialtiesService) {}

  @Get()
  list() {
    return this.specialties.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialties.get(id);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post()
  create(@Body() dto: CreateSpecialtyDto, @CurrentUser() user: JwtPayload) {
    return this.specialties.create(dto, user.sub);
  }
}
