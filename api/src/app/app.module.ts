import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';
import * as path from 'path';

// Resolve database path relative to workspace root (3 levels up from dist/api/src/app)
const getDbPath = () => {
  // In development, __dirname is in dist/api/src/app, go up to workspace root
  const workspaceRoot = path.resolve(__dirname, '../../../../');
  return path.join(workspaceRoot, 'taskdb.sqlite');
};

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: [__dirname + '/../../.env', '.env'], // Try api/.env first, then workspace root
    }),
    
    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbPath = configService.get<string>('DB_PATH') || getDbPath();
        console.log(`📁 Database path: ${dbPath}`);
        return {
          type: 'sqlite',
          database: dbPath,
          entities: [User, Organization, Task, AuditLog],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
