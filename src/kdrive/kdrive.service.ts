import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import axios from 'axios';

@Injectable()
export class KdriveService {
  private baseUrl = 'https://api.infomaniak.com/3/drive';

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  private async getHeaders(userId: string) {
    const accessToken = await this.authService.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private getKdriveId(): string {
    return this.configService.get('KDRIVE_ID') || '';
  }

  async findFolderByPath(userId: string): Promise<number | null> {
    const folderPath = this.configService.get('FOLDER_PATH');
    const parts = folderPath.split('/').filter((p) => p);
    const kdriveId = this.getKdriveId();
    const headers = await this.getHeaders(userId);

    let currentFolderId = null; // root

    for (const part of parts) {
      const url = currentFolderId
        ? `${this.baseUrl}/${kdriveId}/files/${currentFolderId}/files`
        : `${this.baseUrl}/${kdriveId}/files`;

      const response = await axios.get(url, { headers });
      const files = response.data.data || [];
      const folder = files.find(
        (f: any) => f.name === part && f.type === 'dir',
      );

      if (!folder) {
        return null;
      }
      currentFolderId = folder.id;
    }

    return currentFolderId;
  }

  async listPatientFiles(userId: string): Promise<any[]> {
    const folderId = await this.findFolderByPath(userId);
    if (!folderId) {
      throw new Error('Folder not found');
    }

    const kdriveId = this.getKdriveId();
    const headers = await this.getHeaders(userId);

    const response = await axios.get(
      `${this.baseUrl}/${kdriveId}/files/${folderId}/files`,
      { headers },
    );

    const files = response.data.data || [];
    return files
      .filter((f: any) => f.name.endsWith('.json'))
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        modified: f.last_modified_at,
      }));
  }

  async getFile(userId: string, fileId: number): Promise<any> {
    const kdriveId = this.getKdriveId();
    const headers = await this.getHeaders(userId);

    // Get file download URL
    const response = await axios.get(
      `${this.baseUrl}/${kdriveId}/files/${fileId}/download`,
      { headers },
    );

    // Download the actual file content
    const fileContent = await axios.get(response.data.data.url);
    return fileContent.data;
  }

  async saveFile(
    userId: string,
    fileId: number | null,
    fileName: string,
    content: any,
  ): Promise<any> {
    const kdriveId = this.getKdriveId();
    const headers = await this.getHeaders(userId);

    if (fileId) {
      // Update existing file
      const response = await axios.put(
        `${this.baseUrl}/${kdriveId}/files/${fileId}/content`,
        content,
        { headers: { ...headers, 'Content-Type': 'application/json' } },
      );
      return response.data;
    } else {
      // Create new file
      const folderId = await this.findFolderByPath(userId);
      if (!folderId) {
        throw new Error('Folder not found');
      }

      const response = await axios.post(
        `${this.baseUrl}/${kdriveId}/files/${folderId}/file`,
        {
          name: fileName,
          content: JSON.stringify(content),
        },
        { headers },
      );
      return response.data;
    }
  }

  async deleteFile(userId: string, fileId: number): Promise<void> {
    const kdriveId = this.getKdriveId();
    const headers = await this.getHeaders(userId);

    await axios.delete(`${this.baseUrl}/${kdriveId}/files/${fileId}`, {
      headers,
    });
  }
}
