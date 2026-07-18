import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

import { User, UserDocument, UserRole, UserStatus } from '../../domain/schemas/user.schema';
import { Session, SessionDocument } from '../../domain/schemas/supporting.schema';
import { AuditLog, AuditLogDocument } from '../../domain/schemas/supporting.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────
  async register(dto: RegisterDto, ip?: string) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      status: UserStatus.ACTIVE,
    });

    await this.audit(user._id.toString(), 'REGISTER', 'user', user._id.toString(), ip);
    this.eventEmitter.emit('user.registered', { userId: user._id, email: user.email });

    return this.generateTokens(user);
  }

  // ─── Login ─────────────────────────────────────────────────────────────
  async login(dto: LoginDto, deviceInfo: string, ip?: string) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).select('+password');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account temporarily locked. Try again later.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password || '');
    if (!isPasswordValid) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $inc: { loginAttempts: 1 }, $set: { lockedUntil: user.loginAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : undefined } },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) throw new ForbiddenException('Account suspended');

    // Reset login attempts
    await this.userModel.updateOne(
      { _id: user._id },
      { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
    );

    // MFA check
    if (user.mfaEnabled) {
      return { requiresMfa: true, tempToken: this.generateTempToken(user._id.toString()) };
    }

    await this.audit(user._id.toString(), 'LOGIN', 'user', user._id.toString(), ip);
    const tokens = await this.generateTokens(user);
    await this.createSession(user._id.toString(), tokens.refreshToken, deviceInfo, ip);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── MFA Verify ────────────────────────────────────────────────────────
  async verifyMfa(userId: string, token: string, deviceInfo: string, ip?: string) {
    const user = await this.userModel.findById(userId).select('+mfaSecret');
    if (!user || !user.mfaSecret) throw new BadRequestException('MFA not configured');

    const isValid = authenticator.verify({ token, secret: user.mfaSecret });
    if (!isValid) throw new UnauthorizedException('Invalid MFA token');

    const tokens = await this.generateTokens(user);
    await this.createSession(userId, tokens.refreshToken, deviceInfo, ip);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── MFA Setup ─────────────────────────────────────────────────────────
  async setupMfa(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'AegisPay AI', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    // Store secret temporarily (confirm before enabling)
    await this.userModel.updateOne({ _id: userId }, { mfaSecret: secret });
    return { secret, qrCodeUrl, otpauthUrl };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────
  async refreshToken(refreshToken: string) {
    const session = await this.sessionModel.findOne({ refreshToken, isActive: true });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(session.userId);
    if (!user || user.status === UserStatus.SUSPENDED) throw new UnauthorizedException();

    const tokens = await this.generateTokens(user);
    await this.sessionModel.updateOne({ _id: session._id }, { refreshToken: tokens.refreshToken });
    return tokens;
  }

  // ─── Logout ────────────────────────────────────────────────────────────
  async logout(refreshToken: string, userId: string) {
    await this.sessionModel.updateOne({ refreshToken, userId }, { isActive: false });
    await this.audit(userId, 'LOGOUT', 'session', userId);
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────
  async googleLogin(profile: any, deviceInfo: string, ip?: string) {
    let user = await this.userModel.findOne({ googleId: profile.id });

    if (!user) {
      user = await this.userModel.findOne({ email: profile.emails[0].value });
      if (user) {
        await this.userModel.updateOne({ _id: user._id }, { googleId: profile.id });
      } else {
        user = await this.userModel.create({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          emailVerified: true,
          status: UserStatus.ACTIVE,
        });
      }
    }

    const tokens = await this.generateTokens(user);
    await this.createSession(user._id.toString(), tokens.refreshToken, deviceInfo, ip);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Validate User (for LocalStrategy) ────────────────────────────────
  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password || '');
    return valid ? user : null;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────
  private async generateTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    return { accessToken, refreshToken };
  }

  private generateTempToken(userId: string) {
    return this.jwtService.sign({ sub: userId, type: 'mfa_temp' }, { expiresIn: '5m' });
  }

  private async createSession(userId: string, refreshToken: string, deviceInfo: string, ip?: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionModel.create({ userId, refreshToken, deviceInfo, ipAddress: ip, expiresAt });
  }

  private sanitizeUser(user: UserDocument) {
    const { password, mfaSecret, ...safe } = (user as any).toObject();
    return safe;
  }

  private async audit(userId: string, action: string, resource: string, resourceId?: string, ip?: string) {
    await this.auditModel.create({ userId, action, resource, resourceId, ipAddress: ip, timestamp: new Date() });
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).select('-password -mfaSecret');
  }
}
