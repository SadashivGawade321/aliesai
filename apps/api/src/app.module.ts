import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { TrustModule } from './modules/trust/trust.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

// Infrastructure
import { CacheModule } from './infrastructure/cache/cache.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      expandVariables: false,
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URI', 'mongodb://localhost:27017/aegispay'),
        connectionFactory: (connection) => {
          console.log('✅ MongoDB connected');
          connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    // Event emitter (replaces Kafka for local dev)
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.', maxListeners: 20 }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: cfg.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: cfg.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),

    // Infrastructure
    CacheModule,

    // Feature modules
    AuthModule,
    EscrowModule,
    SettlementModule,
    OrdersModule,
    FraudModule,
    TrustModule,
    InsuranceModule,
    NotificationsModule,
    EvidenceModule,
    AnalyticsModule,
    AdminModule,
  ],
})
export class AppModule {}
