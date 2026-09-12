/**
 * Centralized, production-hardened API client.
 * Ensures all requests:
 * 1. Send explicit Accept: application/json
 * 2. Validate response.ok
 * 3. Validate Content-Type contains application/json before calling .json()
 * 4. Surface rich error messages with status code, endpoint URL, and snippet preview
 * 5. Strictly prevent HTML/SPA fallback body parse crashes (e.g. Unexpected token '<'...)
 */

export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  responsePreview?: string;

  constructor(message: string, status: number, statusText: string, url: string, responsePreview?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.responsePreview = responsePreview;
  }
}

export async function requestJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    throw new ApiError(
      `Network connection failure while connecting to ${url}: ${networkErr.message || 'Unknown network error'}`,
      0,
      'NETWORK_ERROR',
      url
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    const rawText = await response.text();
    const preview = rawText.slice(0, 160).trim();
    const isHtml = preview.startsWith('<!doctype') || preview.startsWith('<!DOCTYPE') || preview.startsWith('<html');
    
    let errorDetail = `Expected JSON from ${url} but received ${contentType || 'non-JSON response'} (HTTP ${response.status} ${response.statusText}).`;
    if (isHtml) {
      errorDetail += ` The server returned an HTML document instead of an API payload. Preview: "${preview.replace(/\s+/g, ' ')}..."`;
    } else if (preview) {
      errorDetail += ` Response snippet: "${preview}"`;
    }

    throw new ApiError(errorDetail, response.status, response.statusText, url, preview);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonErr: any) {
    throw new ApiError(
      `Malformed JSON payload returned from ${url} (HTTP ${response.status}): ${jsonErr.message}`,
      response.status,
      response.statusText,
      url
    );
  }

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || `Request failed with HTTP status ${response.status}`;
    throw new ApiError(message, response.status, response.statusText, url, JSON.stringify(data).slice(0, 160));
  }

  return data as T;
}
