import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @Length(3, 120, { message: 'Nome deve ter entre 3 e 120 caracteres' })
  name!: string;

  @Matches(/^\d{4,7}$/, { message: 'CRM fictício deve ter de 4 a 7 dígitos' })
  crm!: string;

  @Matches(/^[A-Z]{2}$/, { message: 'UF deve ter 2 letras maiúsculas' })
  crmUf!: string;

  @IsUUID('4', { message: 'Especialidade inválida' })
  specialtyId!: string;

  @Matches(/^[\d\s()+-]{8,20}$/, { message: 'Telefone inválido' })
  phone!: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  name?: string;

  @IsOptional()
  @Matches(/^\d{4,7}$/)
  crm?: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  crmUf?: string;

  @IsOptional()
  @IsUUID('4')
  specialtyId?: string;

  @IsOptional()
  @Matches(/^[\d\s()+-]{8,20}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
