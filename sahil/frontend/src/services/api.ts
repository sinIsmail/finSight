export async function uploadFile(file: File, onProgress?: (msg: string, pct: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.body) throw new Error('No response body');

  // Open the stream reader
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode the chunk of text FastAPI just yielded
    const chunks = decoder.decode(value).split('\n').filter(Boolean);

    for (const chunk of chunks) {
      const parsed = JSON.parse(chunk);

      if (parsed.status === 'progress' && onProgress) {
        // Send the real-time message back to the UI!
        onProgress(parsed.message, parsed.progress);
      } else if (parsed.status === 'success' || parsed.status === 'error') {
        finalResult = parsed;
      }
    }
  }

  if (finalResult?.status === 'error') throw new Error(finalResult.message);
  return finalResult;
}