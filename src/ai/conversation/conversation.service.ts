import { Injectable } from '@nestjs/common';

interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
  at: number;
}

@Injectable()
export class ConversationService {
  private static readonly MAX_TURNS = 10;
  private static readonly TTL_MS = 30 * 60 * 1000;
  private readonly sessions = new Map<string, ConversationTurn[]>();

  getContext(sessionId?: string): string | undefined {
    if (!sessionId) return undefined;
    const turns = this.activeTurns(sessionId);
    if (!turns.length) return undefined;
    return turns
      .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.text}`)
      .join('\n');
  }

  append(
    sessionId: string | undefined,
    userText: string,
    assistantText: string,
  ): void {
    if (!sessionId) return;
    const turns = this.activeTurns(sessionId);
    const now = Date.now();
    turns.push({ role: 'user', text: userText, at: now });
    turns.push({ role: 'assistant', text: assistantText, at: now });
    while (turns.length > ConversationService.MAX_TURNS) turns.shift();
    this.sessions.set(sessionId, turns);
  }

  reset(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private activeTurns(sessionId: string): ConversationTurn[] {
    const all = this.sessions.get(sessionId) ?? [];
    const cutoff = Date.now() - ConversationService.TTL_MS;
    const fresh = all.filter((t) => t.at > cutoff);
    if (fresh.length !== all.length) this.sessions.set(sessionId, fresh);
    return fresh;
  }
}
