import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
    private dayTypes: DayTypesService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('El email ya está registrado');
    this.logger.log(`Registrando nuevo usuario: ${email}`);
    const user = await this.users.create(email, password, name);
    await this.prisma.profile.create({ data: { userId: user.id } });

    // Paso 3.4: crear tipos de día predeterminados para el usuario nuevo
    await this.dayTypes.seedDefaultDayTypes(user.id);

    this.logger.log(`Usuario registrado con id=${user.id}`);
    return this.generateTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    this.logger.log(`Login exitoso para userId=${user.id}`);
    return this.generateTokens(user.id, user.email);
  }

  // B-01 FIX: refresh ahora hace lookup del usuario para obtener el email real
  async refresh(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.users.findById(stored.userId);
    if (!user) {
      await this.prisma.refreshToken.delete({ where: { token } });
      throw new UnauthorizedException('Usuario no encontrado para este refresh token');
    }

    this.logger.log(`Refresh token rotado para userId=${stored.userId}`);
    await this.prisma.refreshToken.delete({ where: { token } });
    return this.generateTokens(user.id, user.email);
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
    this.logger.log('Refresh token eliminado en logout');
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload, {
      secret:    this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret:    this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
    return { accessToken, refreshToken };
  }
}
