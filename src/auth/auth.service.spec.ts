import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const usersMock = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateRefreshToken: jest.fn(),
};

const jwtMock = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersMock },
        { provide: JwtService,   useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('crea un usuario nuevo y retorna tokens', async () => {
      usersMock.findByEmail.mockResolvedValue(null);
      usersMock.create.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      usersMock.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.register('test@test.com', 'password123');

      expect(usersMock.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      usersMock.findByEmail.mockResolvedValue({ id: 'existing', email: 'test@test.com' });

      await expect(
        service.register('test@test.com', 'password123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    it('retorna tokens para credenciales válidas', async () => {
      const hash = await bcrypt.hash('password123', 10);
      usersMock.findByEmail.mockResolvedValue({ id: 'user-1', email: 'test@test.com', passwordHash: hash });
      usersMock.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login('test@test.com', 'password123');

      expect(result).toHaveProperty('accessToken');
    });

    it('lanza UnauthorizedException para password incorrecto', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      usersMock.findByEmail.mockResolvedValue({ id: 'user-1', email: 'test@test.com', passwordHash: hash });

      await expect(
        service.login('test@test.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      usersMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('noexiste@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
