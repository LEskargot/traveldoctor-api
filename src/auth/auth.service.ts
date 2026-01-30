import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  // Token is now passed directly from client, no server-side storage needed
  validateToken(token: string): boolean {
    return !!token && token.length > 10;
  }
}
