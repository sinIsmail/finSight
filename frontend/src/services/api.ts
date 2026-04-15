import type { Platform } from '../types';

const API_BASE = 'http://localhost:8000/api';

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function uploadFile(
  file: File,
  platform: Platform,
  modelName: string,
  onProgress?: (
    msg: string,
    pct: number,
    partialData?: any[],
    modelSwitched?: { from: string; to: string }
  ) => void
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('platform', platform);
  formData.append('model', modelName);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Server error ${response.status}: ${err}`);
  }

  if (!response.body) throw new Error('No response body from server');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalResult: any = null;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Keep last incomplete line in buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let parsed: any;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        console.warn('Failed to parse SSE line:', trimmed);
        continue;
      }

      switch (parsed.status) {
        case 'progress':
          onProgress?.(parsed.message, parsed.progress ?? 0);
          break;

        case 'partial_data':
          onProgress?.(parsed.message, parsed.progress ?? 0, parsed.data?.preview_data);
          break;

        case 'model_switch':
          // Surface model switch as a progress message plus the switch info
          onProgress?.(parsed.message, 0, undefined, {
            from: parsed.from_model,
            to: parsed.to_model,
          });
          break;

        case 'success':
        case 'error':
          finalResult = parsed;
          break;

        default:
          break;
      }
    }
  }

  if (finalResult?.status === 'error') {
    throw new Error(finalResult.message);
  }

  return finalResult;
}