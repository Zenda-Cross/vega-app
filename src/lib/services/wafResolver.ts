import {headers as commonHeaders} from '../providers/headers';
import type {
  OpenWebViewOptions,
  OpenWebViewResult,
} from '../providers/types';
import {useWafStore} from '../zustand/wafStore';
import {buildCookieString, pickUserAgent} from './cookieManager';
import {providerAuthor} from '../sandbox/providerScope';
import {deleteJarCookie, getJarCookieMap} from '../sandbox/providerCookieJar';
import {
  canPromptWaf,
  isWafOperationDismissed,
  registerWafOperation,
  wafCancelledError,
} from './wafSession';

/**
 * Opens a dialog WebView so the user can solve a WAF / captcha challenge
 * (e.g. Cloudflare) for the given URL.
 *
 * This is exposed to providers via `providerContext.openWebView`. A provider
 * that detects a WAF response should call this with the blocked URL and the
 * request headers it would normally use (passed via `options.headers`), then
 * await the result. The WebView loads the page with those headers; once the
 * challenge is solved the provider receives the page response (rendered HTML)
 * in `result.data` along with the page cookies.
 *
 * Shortcuts:
 *  - If `options.waitForCookie` is already present for the URL, it resolves
 *    immediately with the existing cookies and does NOT open the dialog
 *    (`result.data` is empty in this case).
 *  - If `options.force` is set, the dialog is always opened (the shortcut
 *    above is skipped). The dialog still auto-closes as soon as the awaited
 *    cookie is present.
 *
 * The returned promise:
 *  - resolves with the page response (`data`) and cookies (including httpOnly
 *    cookies) once the user taps "Done" or the optional `waitForCookie` is
 *    detected.
 *  - rejects if the user cancels the dialog or the optional `timeoutMs` elapses.
 *
 * Cookies are read from and saved to the cookie jar of `author` (the
 * provider's source author), never another author's.
 */
// Dictionary to store pending WAF resolution promises by URL/cookie
const pendingRequests: Record<string, Promise<OpenWebViewResult>> = {};

const trackScope = (promise: Promise<OpenWebViewResult>, scope?: AbortSignal) => {
  if (scope) {
    const release = registerWafOperation(scope);
    promise.then(release, release);
  }
  return promise;
};

export const openWebView = (
  url: string,
  options?: OpenWebViewOptions,
  authorRaw?: string,
  scope?: AbortSignal,
): Promise<OpenWebViewResult> => {
  if (isWafOperationDismissed(scope)) return Promise.reject(wafCancelledError());
  const author = providerAuthor(authorRaw);
  if (!url) {
    return Promise.reject(new Error('openWebView: a url is required'));
  }

  const userAgent =
    pickUserAgent(options?.headers) || commonHeaders['User-Agent'];

  // Requests waiting for the same cookie on a site share one dialog. Without
  // waitForCookie the caller needs the page itself, so only the same URL is
  // shared.
  const hostname = url.includes('://') ? url.split('/')[2] : url;
  const siteKey = options?.waitForCookie
    ? `${hostname}:${options.waitForCookie}`
    : url;
  const cacheKey = `${author}|${siteKey}`;
  
  // Request coalescing: if a WAF resolution is already pending for this URL/cookie, return its promise
  // We ALWAYS coalesce, even if force: true, to prevent multiple dialogs for the same domain
  if (cacheKey in pendingRequests) {
    return trackScope(pendingRequests[cacheKey], scope);
  }

  const execute = async (): Promise<OpenWebViewResult> => {
    // If not forced and the awaited cookie already exists, return it without a
    // dialog. In force mode we always open.
    if (!options?.force && options?.waitForCookie) {
      const cookieMap = getJarCookieMap(author, url);
      if (cookieMap[options.waitForCookie]) {
        return {
          data: '',
          cookies: buildCookieString(cookieMap),
          cookieMap,
          url,
          userAgent,
        };
      }
    } else if (options?.waitForCookie) {
      // If it is forced, or if we are about to open the dialog, delete the old cookie
      // because it is either expired or invalid (caused a 403).
      deleteJarCookie(author, url, options.waitForCookie);
    }

    // Background work fails rather than opening a dialog; a solved cookie
    // above can still be reused.
    if (!canPromptWaf(scope)) throw wafCancelledError();

    return new Promise<OpenWebViewResult>((resolve, reject) => {
      useWafStore.getState().enqueue({
        ...options,
        url,
        author,
        resolve,
        reject,
      });
    });
  };

  const promise = execute();

  // Always register the promise for coalescing, even if force: true
  pendingRequests[cacheKey] = promise;

  // Clean up on both outcomes. `then(cleanup, cleanup)` handles the
  // rejection, unlike `finally`, whose derived promise would reject unhandled.
  const cleanup = () => {
    if (pendingRequests[cacheKey] === promise) {
      delete pendingRequests[cacheKey];
    }
  };
  promise.then(cleanup, cleanup);

  return trackScope(promise, scope);
};
