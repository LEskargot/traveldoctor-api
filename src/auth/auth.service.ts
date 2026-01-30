import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  private tokens: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const clientId = this.configService.get('CLIENT_ID');
    const redirectUri = this.configService.get('REDIRECT_URI');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state: state,
    });
    return `https://login.infomaniak.com/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<any> {
    const clientId = this.configService.get('CLIENT_ID');
    const clientSecret = this.configService.get('CLIENT_SECRET');
    const redirectUri = this.configService.get('REDIRECT_URI');

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      'https://login.infomaniak.com/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        }
      },
    );

    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const clientId = this.configService.get('CLIENT_ID');
    const clientSecret = this.configService.get('CLIENT_SECRET');

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      'https://login.infomaniak.com/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        }
      },
    );

    return response.data;
  }

  storeTokens(userId: string, tokens: any): void {
    this.tokens.set(userId, {
      ...tokens,
      expires_at: Date.now() + tokens.expires_in * 1000,
    });
  }

  getTokens(userId: string): any {
    return this.tokens.get(userId);
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const tokens = this.tokens.get(userId);
    if (!tokens) return null;

    if (Date.now() > tokens.expires_at - 60000) {
      const newTokens = await this.refreshToken(tokens.refresh_token);
      this.storeTokens(userId, newTokens);
      return newTokens.access_token;
    }

    return tokens.access_token;
  }
}
