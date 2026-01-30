import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KdriveService {
  private baseUrl = 'https://api.infomaniak.com/3/drive';

  constructor(private configService: ConfigService) {}

  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getKdriveId(): string {
    return this.configService.get('KDRIVE_ID') || '';
  }

  async findFolderByPath(token: string): Promise<number | null> {
    const folderPath = this.configService.get('FOLDER_PATH') || '';
    const parts = folderPath.split('/').filter((p) => p);
    const kdriveId = this.getKdriveId();
    const headers = this.getHeaders(token);

    let currentFolderId: number | null = null;

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

  async listPatientFiles(token: string): Promise<any[]> {
    const folderId = await this.findFolderByPath(token);
    if (!folderId) {
      throw new Error('Folder not found: ' + this.configService.get('FOLDER_PATH'));
    }

    const kdriveId = this.getKdriveId();
    const headers = this.getHeaders(token);

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

  async getFile(token: string, fileId: number): Promise<any> {
    const kdriveId = this.getKdriveId();
    const headers = this.getHeaders(token);

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
    token: string,
    fileId: number | null,
    fileName: string,
    content: any,
  ): Promise<any> {
    const kdriveId = this.getKdriveId();
    const headers = this.getHeaders(token);

    if (fileId) {
      // Update existing file - upload new content
      const uploadUrl = `${this.baseUrl}/${kdriveId}/files/${fileId}/upload`;
      const response = await axios.post(
        uploadUrl,
        JSON.stringify(content),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/octet-stream'
          }
        },
      );
      return response.data;
    } else {
      // Create new file in the folder
      const folderId = await this.findFolderByPath(token);
      if (!folderId) {
        throw new Error('Folder not found');
      }

      // First create empty file, then upload content
      const createResponse = await axios.post(
        `${this.baseUrl}/${kdriveId}/files/${folderId}/file`,
        { name: fileName },
        { headers },
      );

      const newFileId = createResponse.data.data.id;

      // Upload content to the new file
      const uploadUrl = `${this.baseUrl}/${kdriveId}/files/${newFileId}/upload`;
      await axios.post(
        uploadUrl,
        JSON.stringify(content),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/octet-stream'
          }
        },
      );

      return createResponse.data;
    }
  }

  async deleteFile(token: string, fileId: number): Promise<void> {
    const kdriveId = this.getKdriveId();
    const headers = this.getHeaders(token);

    await axios.delete(`${this.baseUrl}/${kdriveId}/files/${fileId}`, {
      headers,
    });
  }
}
