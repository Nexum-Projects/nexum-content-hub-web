/**
 * Sanitizado ligero para renderizar HTML del CMS en Server Components.
 * Elimina bloques script; el contenido proviene del panel administrativo.
 */
export function sanitizeHtmlForDisplay(html?: string | null): string {
  if (!html?.trim()) {
    return "";
  }

  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}
