import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { KdriveService } from './kdrive.service';

@Controller('files')
export class KdriveController {
  constructor(private kdriveService: KdriveService) {}

  private extractToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Missing or invalid Authorization header', HttpStatus.UNAUTHORIZED);
    }
    return authHeader.substring(7);
  }

  @Get()
  async listFiles(@Headers('authorization') authHeader: string) {
    const token = this.extractToken(authHeader);
    try {
      const files = await this.kdriveService.listPatientFiles(token);
      return { success: true, files };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to list files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.extractToken(authHeader);
    try {
      const content = await this.kdriveService.getFile(token, parseInt(id));
      return { success: true, content };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateFile(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
    @Body() body: { fileName: string; content: any },
  ) {
    const token = this.extractToken(authHeader);
    try {
      const fileId = id === 'new' ? null : parseInt(id);
      const result = await this.kdriveService.saveFile(
        token,
        fileId,
        body.fileName,
        body.content,
      );
      return { success: true, result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to save file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.extractToken(authHeader);
    try {
      await this.kdriveService.deleteFile(token, parseInt(id));
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
