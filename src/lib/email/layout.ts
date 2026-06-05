export const APP_NAME = 'Tracked Your Future';

/**
 * Email category. `transactional` and `security` are always sent and never
 * carry an opt-out. `product` is governed by the recipient's email
 * preferences (checked at the call site) and renders a preferences footer.
 */
export type EmailCategory = 'transactional' | 'security' | 'product';

export interface RenderEmailOptions {
  /** Short summary used as the preheader. */
  preheader: string;
  /** Heading shown at the top of the message body. */
  heading: string;
  /** Inner HTML body (paragraphs, links). */
  bodyHtml: string;
  category: EmailCategory;
  /** Link to manage email preferences; only used for the `product` category. */
  preferencesUrl?: string;
}

const COLORS = {
  bg: '#0a0a0a',
  surface: '#111111',
  border: '#1f1f1f',
  accent: '#22c55e',
  text: '#e5e5e5',
  muted: '#8a8a8a',
};

const FONT_STACK =
  "'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";

/**
 * Wraps email body content in the shared retro-terminal branded layout.
 * Uses table layout and inline styles for broad email-client compatibility.
 */
export function renderEmail({
  preheader,
  heading,
  bodyHtml,
  category,
  preferencesUrl,
}: RenderEmailOptions): string {
  const footer =
    category === 'product' && preferencesUrl
      ? `You're receiving this because you opted in to product updates from ${APP_NAME}. <a href="${preferencesUrl}" style="color:${COLORS.accent};text-decoration:underline;">Manage email preferences</a>.`
      : `This is a service message about your ${APP_NAME} account.`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>${APP_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;font-family:${FONT_STACK};">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid ${COLORS.border};">
                <span style="color:${COLORS.accent};font-size:14px;font-weight:700;letter-spacing:0.5px;">tracked_your_future</span><span style="color:${COLORS.muted};font-size:14px;">:~$</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;color:${COLORS.accent};font-size:18px;font-weight:700;font-family:${FONT_STACK};">${heading}</h1>
                <div style="color:${COLORS.text};font-size:14px;line-height:1.6;font-family:${FONT_STACK};">
                  ${bodyHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid ${COLORS.border};color:${COLORS.muted};font-size:12px;line-height:1.5;font-family:${FONT_STACK};">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
