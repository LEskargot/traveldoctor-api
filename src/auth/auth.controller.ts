import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('status')
  status() {
    return {
      message: 'API Token authentication - each user provides their own token',
      tokenUrl: 'https://manager.infomaniak.com/v3/infomaniak-api'
    };
  }
}
