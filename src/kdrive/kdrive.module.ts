import { Module } from '@nestjs/common';
import { KdriveService } from './kdrive.service';
import { KdriveController } from './kdrive.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KdriveController],
  providers: [KdriveService],
})
export class KdriveModule {}
