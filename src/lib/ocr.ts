import { createWorker } from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number;
}

/**
 * Rozpoznaje tekst ze zdjęcia / zrzutu ekranu w przeglądarce przy użyciu Tesseract.js
 * Obsługuje język polski i angielski.
 */
export async function recognizeTextFromImage(
  imageSource: File | Blob | string,
  onProgress?: (p: OcrProgress) => void
): Promise<string> {
  const worker = await createWorker(['pol', 'eng'], 1, {
    logger: m => {
      if (onProgress && m.status && typeof m.progress === 'number') {
        onProgress({
          status: m.status === 'recognizing text' ? 'Rozpoznawanie tekstu...' : m.status,
          progress: Math.round(m.progress * 100)
        });
      }
    }
  });

  try {
    const ret = await worker.recognize(imageSource);
    return ret.data.text || '';
  } finally {
    await worker.terminate();
  }
}
