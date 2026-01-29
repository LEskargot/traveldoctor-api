import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { KdriveService } from './kdrive.service';

@Controller('files')
export class KdriveController {
  constructor(private kdriveService: KdriveService) {}

  @Get()
  async listFiles(@Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    }
    try {
      const files = await this.kdriveService.listPatientFiles(userId);
      return { success: true, files };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to list files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getFile(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    }
    try {
      const content = await this.kdriveService.getFile(userId, parseInt(id));
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
    @Query('userId') userId: string,
    @Body() body: { fileName: string; content: any },
  ) {
    if (!userId) {
      throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    }
    try {
      const fileId = id === 'new' ? null : parseInt(id);
      const result = await this.kdriveService.saveFile(
        userId,
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
  async deleteFile(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId required', HttpStatus.BAD_REQUEST);
    }
    try {
      await this.kdriveService.deleteFile(userId, parseInt(id));
      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
