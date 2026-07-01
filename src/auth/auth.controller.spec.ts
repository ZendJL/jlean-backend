import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';

// Mock de AuthService — evita inyección real de Prisma/JWT/Config
const mockAuthService = {
  register: jest.fn(),
  login:    jest.fn(),
  refresh:  jest.fn(),
  logout:   jest.fn(),
};

// Mock de JwtGuard para no necesitar JWT real en tests de controller
const mockJwtGuard = { canActivate: jest.fn(() => true) };

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ─── POST /auth/register ────────────────────────────────────────────────

  describe('register', () => {
    it('retorna tokens cuando el registro es exitoso', async () => {
      const tokens = { accessToken: 'acc', refreshToken: 'ref' };
      mockAuthService.register.mockResolvedValueOnce(tokens);

      const result = await controller.register({
        email: 'juan@jlean.app',
        password: 'S3cur3Pass!',
        name: 'Juan',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'juan@jlean.app',
        'S3cur3Pass!',
        'Juan',
      );
      expect(result).toEqual(tokens);
    });

    it('lanza ConflictException cuando el email ya está registrado', async () => {
      mockAuthService.register.mockRejectedValueOnce(
        new ConflictException('El email ya está registrado'),
      );

      await expect(
        controller.register({
          email: 'duplicado@jlean.app',
          password: 'pass',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── POST /auth/login ───────────────────────────────────────────────────

  describe('login', () => {
    it('retorna tokens con credenciales correctas', async () => {
      const tokens = { accessToken: 'acc2', refreshToken: 'ref2' };
      mockAuthService.login.mockResolvedValueOnce(tokens);

      const result = await controller.login({
        email: 'juan@jlean.app',
        password: 'S3cur3Pass!',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'juan@jlean.app',
        'S3cur3Pass!',
      );
      expect(result).toEqual(tokens);
    });

    it('lanza UnauthorizedException con contraseña incorrecta', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Credenciales inválidas'),
      );

      await expect(
        controller.login({ email: 'juan@jlean.app', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException cuando el usuario no existe', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Credenciales inválidas'),
      );

      await expect(
        controller.login({ email: 'noexiste@jlean.app', password: 'cualquier' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── POST /auth/refresh ─────────────────────────────────────────────────

  describe('refresh', () => {
    it('retorna nuevos tokens con refresh token válido', async () => {
      const tokens = { accessToken: 'new_acc', refreshToken: 'new_ref' };
      mockAuthService.refresh.mockResolvedValueOnce(tokens);

      const result = await controller.refresh({ refreshToken: 'valid_refresh' });

      expect(mockAuthService.refresh).toHaveBeenCalledWith('valid_refresh');
      expect(result).toEqual(tokens);
    });

    it('lanza UnauthorizedException con refresh token expirado', async () => {
      mockAuthService.refresh.mockRejectedValueOnce(
        new UnauthorizedException('Refresh token inválido o expirado'),
      );

      await expect(
        controller.refresh({ refreshToken: 'expired_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── POST /auth/logout ──────────────────────────────────────────────────

  describe('logout', () => {
    it('llama a auth.logout con el refresh token correcto', async () => {
      mockAuthService.logout.mockResolvedValueOnce(undefined);

      await controller.logout({ refreshToken: 'some_refresh' });

      expect(mockAuthService.logout).toHaveBeenCalledWith('some_refresh');
    });
  });
});
