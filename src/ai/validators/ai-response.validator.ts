import { Logger } from '@nestjs/common';

const logger = new Logger('AiResponseValidator');

export interface TranslateAiPayload {
  detectedLanguage: string;
  translatedText: string;
}

export interface AnalyzeAiPayload {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

const SEVERITIES: ReadonlyArray<AnalyzeAiPayload['severity']> = [
  'info',
  'warning',
  'error',
];

export function validateTranslateResponse(
  raw: unknown,
  fallback: { translatedText: string; sourceLanguage?: string },
): TranslateAiPayload {
  const obj = isObject(raw) ? raw : {};
  const translatedText =
    typeof obj.translatedText === 'string' && obj.translatedText.trim()
      ? obj.translatedText.trim()
      : fallback.translatedText.trim();
  const detectedLanguage =
    typeof obj.detectedLanguage === 'string' && obj.detectedLanguage.trim()
      ? obj.detectedLanguage.trim()
      : fallback.sourceLanguage?.trim() || 'unknown';

  if (!isObject(raw) || !obj.translatedText) {
    logger.warn('Translate response failed schema validation, used fallback');
  }
  return { translatedText, detectedLanguage };
}

export function validateAnalyzeResponse(
  raw: unknown,
  fallbackText: string,
): AnalyzeAiPayload {
  const obj = isObject(raw) ? raw : {};
  const analysis =
    typeof obj.analysis === 'string' && obj.analysis.trim()
      ? obj.analysis.trim()
      : fallbackText.trim();

  const suggestions = Array.isArray(obj.suggestions)
    ? obj.suggestions
        .filter(
          (s): s is string => typeof s === 'string' && s.trim().length > 0,
        )
        .map((s) => s.trim())
    : [];

  const severity: AnalyzeAiPayload['severity'] = SEVERITIES.includes(
    obj.severity as AnalyzeAiPayload['severity'],
  )
    ? (obj.severity as AnalyzeAiPayload['severity'])
    : 'info';

  if (
    !isObject(raw) ||
    typeof obj.analysis !== 'string' ||
    !Array.isArray(obj.suggestions)
  ) {
    logger.warn('Analyze response failed schema validation, used fallback');
  }
  return { analysis, suggestions, severity };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
