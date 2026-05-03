import { Injectable } from '@nestjs/common';

export type SummaryLength = 'short' | 'medium' | 'detailed';
export type AnalyzeTask = 'review' | 'bugs' | 'optimize' | 'explain';

@Injectable()
export class PromptsService {
  summarize(content: string, length: SummaryLength = 'medium'): string {
    const sizeHint: Record<SummaryLength, string> = {
      short: 'in 1-2 concise sentences (max ~40 words)',
      medium: 'in 3-5 sentences (max ~120 words)',
      detailed: 'in 8-12 sentences keeping all key facts (max ~300 words)',
    };
    return [
      'You are a precise technical summarizer.',
      `Summarize the article ${sizeHint[length]}.`,
      'Preserve named entities, numbers and key terminology.',
      'Return plain text only — no markdown, no preamble, no quotes.',
      '',
      'ARTICLE:',
      '"""',
      content,
      '"""',
    ].join('\n');
  }

  translate(
    content: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): string {
    const src = sourceLanguage
      ? `The source language is ${sourceLanguage}.`
      : 'Detect the source language automatically.';
    return [
      'You are a professional translator.',
      src,
      `Translate the article into ${targetLanguage}.`,
      'Preserve formatting, code blocks and technical terminology.',
      'Return ONLY a JSON object with this exact shape, no markdown fences:',
      '{"detectedLanguage": string, "translatedText": string}',
      '',
      'ARTICLE:',
      '"""',
      content,
      '"""',
    ].join('\n');
  }

  analyze(content: string, task: AnalyzeTask = 'review'): string {
    const taskHint: Record<AnalyzeTask, string> = {
      review:
        'Provide an editorial review: clarity, structure, factual issues.',
      bugs: 'Find logical errors, contradictions or factual mistakes in the article.',
      optimize:
        'Suggest concrete improvements to wording, structure and depth.',
      explain: 'Explain the main ideas of the article in simpler terms.',
    };
    return [
      'You are an expert technical reviewer.',
      taskHint[task],
      'Return ONLY a JSON object with this exact shape (no markdown fences):',
      '{',
      '  "analysis": string,            // 2-5 sentences overall verdict',
      '  "suggestions": string[],       // 3-7 actionable bullets',
      '  "severity": "info" | "warning" | "error"',
      '}',
      '',
      'ARTICLE:',
      '"""',
      content,
      '"""',
    ].join('\n');
  }

  generic(prompt: string, context?: string): string {
    if (!context) return prompt;
    return `Conversation so far:\n${context}\n\nUser:\n${prompt}`;
  }
}
