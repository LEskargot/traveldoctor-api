import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  login(@Res() res: Response) {
    const state = Math.random().toString(36).substring(7);
    const authUrl = this.authService.getAuthUrl(state);
    res.redirect(authUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const tokens = await this.authService.exchangeCode(code);

      // Decode the ID token to get user info
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split('.')[1], 'base64').toString(),
      );
      const userId = payload.sub;

      this.authService.storeTokens(userId, tokens);

      // Redirect back to app with user ID
      res.redirect(`https://traveldoctor.ch/app?userId=${userId}&login=success`);
    } catch (error) {
      // Temporarily show error for debugging
      res.status(500).json({ error: error.message, details: error.response?.data });
    }
  }

  @Get('status')
  status(@Query('userId') userId: string) {
    const tokens = this.authService.getTokens(userId);
    return { authenticated: !!tokens };
  }
}
