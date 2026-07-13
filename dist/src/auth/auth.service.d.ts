import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { DayTypesService } from '../day-types/day-types.service';
export declare class AuthService {
    private users;
    private jwt;
    private config;
    private prisma;
    private dayTypes;
    private readonly logger;
    constructor(users: UsersService, jwt: JwtService, config: ConfigService, prisma: PrismaService, dayTypes: DayTypesService);
    register(email: string, password: string, name: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(token: string): Promise<void>;
    private generateTokens;
}
