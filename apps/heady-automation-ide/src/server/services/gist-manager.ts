/**
 * GitHub Gists Integration for Heady Automation IDE
 * Manages code snippet storage, sharing, and retrieval
 */

import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger.js';

export interface GistFile {
  filename: string;
  content: string;
  language?: string;
}

export interface GistMetadata {
  id: string;
  description: string;
  public: boolean;
  url: string;
  files: string[];
  createdAt: string;
  updatedAt: string;
}

export class GistManager {
  private octokit: Octokit;

  constructor(token?: string) {
    const githubToken = token || process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GitHub token required for Gist integration');
    }

    this.octokit = new Octokit({ auth: githubToken });
  }

  /**
   * Create a new Gist
   */
  async createGist(
    description: string,
    files: GistFile[],
    isPublic = false
  ): Promise<GistMetadata> {
    try {
      const filesObject: Record<string, { content: string }> = {};
      files.forEach((file) => {
        filesObject[file.filename] = { content: file.content };
      });

      const response = await this.octokit.gists.create({
        description,
        public: isPublic,
        files: filesObject,
      });

      logger.info('Gist created', {
        gistId: response.data.id,
        description,
        fileCount: files.length,
      });

      return this.formatGistMetadata(response.data);
    } catch (error) {
      logger.error('Failed to create Gist', {}, error as Error);
      throw error;
    }
  }

  /**
   * Get a Gist by ID
   */
  async getGist(gistId: string): Promise<GistMetadata> {
    try {
      const response = await this.octokit.gists.get({ gist_id: gistId });
      return this.formatGistMetadata(response.data);
    } catch (error) {
      logger.error('Failed to get Gist', { gistId }, error as Error);
      throw error;
    }
  }

  /**
   * Update an existing Gist
   */
  async updateGist(gistId: string, files: GistFile[], description?: string): Promise<GistMetadata> {
    try {
      const filesObject: Record<string, { content: string }> = {};
      files.forEach((file) => {
        filesObject[file.filename] = { content: file.content };
      });

      const response = await this.octokit.gists.update({
        gist_id: gistId,
        description,
        files: filesObject,
      });

      logger.info('Gist updated', { gistId, fileCount: files.length });

      return this.formatGistMetadata(response.data);
    } catch (error) {
      logger.error('Failed to update Gist', { gistId }, error as Error);
      throw error;
    }
  }

  /**
   * Delete a Gist
   */
  async deleteGist(gistId: string): Promise<void> {
    try {
      await this.octokit.gists.delete({ gist_id: gistId });
      logger.info('Gist deleted', { gistId });
    } catch (error) {
      logger.error('Failed to delete Gist', { gistId }, error as Error);
      throw error;
    }
  }

  /**
   * List user's Gists
   */
  async listGists(perPage = 30): Promise<GistMetadata[]> {
    try {
      const response = await this.octokit.gists.list({ per_page: perPage });
      return response.data.map((gist) => this.formatGistMetadata(gist));
    } catch (error) {
      logger.error('Failed to list Gists', {}, error as Error);
      throw error;
    }
  }

  /**
   * Search Gists by description
   */
  async searchGists(query: string): Promise<GistMetadata[]> {
    try {
      const allGists = await this.listGists(100);
      return allGists.filter((gist) =>
        gist.description.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      logger.error('Failed to search Gists', { query }, error as Error);
      throw error;
    }
  }

  /**
   * Save code snippet as Gist
   */
  async saveSnippet(
    code: string,
    filename: string,
    description: string,
    tags: string[] = []
  ): Promise<GistMetadata> {
    const taggedDescription = tags.length > 0 ? `${description} [${tags.join(', ')}]` : description;

    return await this.createGist(
      taggedDescription,
      [{ filename, content: code }],
      false
    );
  }

  /**
   * Format Gist data to metadata
   */
  private formatGistMetadata(gist: any): GistMetadata {
    return {
      id: gist.id,
      description: gist.description || '',
      public: gist.public,
      url: gist.html_url,
      files: Object.keys(gist.files || {}),
      createdAt: gist.created_at,
      updatedAt: gist.updated_at,
    };
  }
}

// Singleton instance
let gistManagerInstance: GistManager | null = null;

export function getGistManager(): GistManager {
  if (!gistManagerInstance) {
    gistManagerInstance = new GistManager();
  }
  return gistManagerInstance;
}
