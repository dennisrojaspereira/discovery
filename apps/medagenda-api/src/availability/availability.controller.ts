import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { AvailabilityService } from './availability.service';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

class CreateRuleDto {
  @IsUUID('4')
  doctorId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(TIME_REGEX, { message: 'startTime deve estar no formato HH:mm' })
  startTime!: string;

  @Matches(TIME_REGEX, { message: 'endTime deve estar no formato HH:mm' })
  endTime!: string;

  @IsInt()
  @Min(10)
  @Max(240)
  slotDurationMin!: number;

  @IsInt()
  @Min(0)
  @Max(60)
  bufferMin!: number;
}

class CreateBlockDto {
  @IsUUID('4')
  doctorId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get('rules')
  listRules(@Query('doctorId') doctorId?: string) {
    return this.availability.listRules(doctorId);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post('rules')
  createRule(@Body() dto: CreateRuleDto, @CurrentUser() user: JwtPayload) {
    return this.availability.createRule(dto, user.sub);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Delete('rules/:id')
  deleteRule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.availability.deleteRule(id, user.sub);
  }

  @Get('blocks')
  listBlocks(@Query('doctorId') doctorId?: string) {
    return this.availability.listBlocks(doctorId);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Post('blocks')
  createBlock(@Body() dto: CreateBlockDto, @CurrentUser() user: JwtPayload) {
    return this.availability.createBlock(dto, user.sub);
  }

  @Roles('ADMIN', 'RECEPCAO')
  @Delete('blocks/:id')
  deleteBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.availability.deleteBlock(id, user.sub);
  }

  /** Slots de um médico em uma data (AAAA-MM-DD) */
  @Get('slots')
  slots(
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ) {
    return this.availability.slotsForDate(doctorId, date);
  }
}
