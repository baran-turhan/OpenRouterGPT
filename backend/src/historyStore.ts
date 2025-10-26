import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import { SessionHistory, StoredMessage } from './types';

export class HistoryStore {
  private readonly histories = new Map<string, SessionHistory>();
  private loadPromise: Promise<void> | null = null;

  constructor(private readonly filePath: string) {
    this.loadPromise = this.loadFromDisk();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loadPromise != null) {
      await this.loadPromise;
      this.loadPromise = null;
    }
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed: SessionHistory[] = JSON.parse(content);
      parsed.forEach((session) => {
        this.histories.set(session.sessionId, session);
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.persist();
      } else {
        console.warn('[history] Unable to load history file:', error);
      }
    }
  }

  private async persist(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.filePath,
      JSON.stringify(Array.from(this.histories.values()), null, 2),
      'utf-8'
    );
  }

  public async getSession(sessionId: string): Promise<SessionHistory | null> {
    await this.ensureLoaded();
    return this.histories.get(sessionId) ?? null;
  }

  public async listSessions(): Promise<SessionHistory[]> {
    await this.ensureLoaded();
    return Array.from(this.histories.values()).sort((a, b) =>
      a.updatedAt > b.updatedAt ? -1 : 1
    );
  }

  public async appendMessage(
    sessionId: string,
    message: Omit<StoredMessage, 'id' | 'createdAt'> & {
      createdAt?: string;
    }
  ): Promise<SessionHistory> {
    await this.ensureLoaded();
    const nowIso = new Date().toISOString();
    const entry: StoredMessage = {
      ...message,
      id: uuid(),
      createdAt: message.createdAt ?? nowIso
    };
    const existing = this.histories.get(sessionId) ?? {
      sessionId,
      messages: [],
      updatedAt: nowIso
    };
    const updated: SessionHistory = {
      ...existing,
      messages: [...existing.messages, entry],
      updatedAt: nowIso
    };
    this.histories.set(sessionId, updated);
    await this.persist();
    return updated;
  }

  public async overwrite(session: SessionHistory): Promise<void> {
    await this.ensureLoaded();
    this.histories.set(session.sessionId, session);
    await this.persist();
  }

  public async clear(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    this.histories.delete(sessionId);
    await this.persist();
  }
}
