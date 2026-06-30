/**
 * Tests del AuthService — Fase 12.1
 * Cubre: registro, login, refresh token y logout.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const MOCK_USER = {
  id: 'user-1',
  email: 'test@jlean.app',
  passwordHash: 'hashed-pw',
  name: 'Test User',
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<UsersService>;
  let prisma: any;
  let dayTypes: jest.Mocked<DayTypesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
        {
          provide: PrismaService,
          useValue: {
            profile: { create: jest.fn().mockResolvedValue({}) },
            refreshToken: {
              create: jest.fn().mockResolvedValue({}),
              findUnique: jest.fn(),
              delete: jest.fn().mockResolvedValue({}),
              deleteMany: jest.fn().mockResolvedValue({}),
            },
          },
        },
        {
          provide: DayTypesService,
          useValue: { seedDefaultDayTypes: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    users = module.get(UsersService);
    prisma = module.get(PrismaService);
    dayTypes = module.get(DayTypesService);
  });

  // --- register ---
  describe('register', () => {
    it('lanza ConflictException si el email ya existe', async () => {
      users.findByEmail.mockResolvedValue(MOCK_USER as any);
      await expect(service.register('test@jlean.app', 'pw', 'Test'))
        .rejects.toThrow(ConflictException);
    });

    it('crea usuario, perfil, tipos de día y retorna tokens', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(MOCK_USER as any);
      const result = await service.register('new@jlean.app', 'pw', 'New');
      expect(users.create).toHaveBeenCalledWith('new@jlean.app', 'pw', 'New');
      expect(prisma.profile.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
      expect(dayTypes.seedDefaultDayTypes).toHaveBeenCalledWith('user-1');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  // --- login ---
  describe('login', () => {
    it('lanza UnauthorizedException si el usuario no existe', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.login('x@x.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el password es incorrecto', async () => {
      users.findByEmail.mockResolvedValue(MOCK_USER as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);
      await expect(service.login('test@jlean.app', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('retorna tokens si las credenciales son correctas', async () => {
      users.findByEmail.mockResolvedValue(MOCK_USER as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      const result = await service.login('test@jlean.app', 'correct');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  // --- refresh ---
  describe('refresh', () => {
    it('lanza UnauthorizedException si el token no existe', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el token está expirado', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'old', userId: 'user-1', expiresAt: new Date('2020-01-01'),
      });
      await expect(service.refresh('old')).rejects.toThrow(UnauthorizedException);
    });

    it('rota el token y retorna nuevos tokens si es válido', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'valid-rt', userId: 'user-1', expiresAt: new Date(Date.now() + 86400000),
      });
      users.findById.mockResolvedValue(MOCK_USER as any);
      const result = await service.refresh('valid-rt');
      expect(prisma.refreshToken.delete).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });
  });

  // --- logout ---
  describe('logout', () => {
    it('elimina el refresh token de la BD', async () => {
      await service.logout('some-token');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'some-token' } });
    });
  });
});
