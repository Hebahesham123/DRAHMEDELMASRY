/** Wraps inline page JavaScript so it runs after React hydration (see ThemeScripts). */
export function deferred(js: string) {
  return `(window.__dsnQueue = window.__dsnQueue || []).push(function () { ${js} });`;
}
