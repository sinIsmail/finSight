export async function uploadFile(
  file: File, 
  onProgress?: (msg: string, pct: number, partialData?: any[]) => void // <-- Add partialData here
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'gemini-2.5-flash'); // Add model choice if needed

  const response = await fetch('http://localhost:8000/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunks = decoder.decode(value).split('\n').filter(Boolean);

    for (const chunk of chunks) {
      const parsed = JSON.parse(chunk);

      if (parsed.status === 'progress' && onProgress) {
        onProgress(parsed.message, parsed.progress);
      } 
      // ✨ NEW: Catch partial_data and send the new transactions to the UI instantly!
      else if (parsed.status === 'partial_data' && onProgress) {
        onProgress(parsed.message, parsed.progress, parsed.data.preview_data);
      } 
      else if (parsed.status === 'success' || parsed.status === 'error') {
        finalResult = parsed;
      }
    }
  }

  if (finalResult?.status === 'error') throw new Error(finalResult.message);
  return finalResult;
}
