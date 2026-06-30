import { IsEmail, IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'La contraseña debe tener al menos una mayúscula, un número y un carácter especial',
  })
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
