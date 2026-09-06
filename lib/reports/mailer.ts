import 'server-only';

/**
 * ORENZA email transport backed by SMTP2GO.
 *
 * All application email (OTP, KYC verification and operational reports)
 * goes through this single server-side boundary. No Resend API or SDK is used.
 *
 * Required environment variables:
 * SMTP2GO_API_KEY, SMTP2GO_FROM_EMAIL
 */

const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3/email/send';

export async function sendOrenzaEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const apiKey = process.env.SMTP2GO_API_KEY;
  const from = process.env.SMTP2GO_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false, configured: false } as const;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(SMTP2GO_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': apiKey,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: from,
        to: [input.to],
        subject: input.subject,
        text_body: input.text,
        ...(input.html ? { html_body: input.html } : {}),
      }),
    });

    if (!response.ok) return { ok: false, configured: true } as const;

    const result = await response.json().catch(() => null) as { data?: { succeeded?: number; failed?: number } } | null;
    const succeeded = Number(result?.data?.succeeded ?? 0);
    return { ok: succeeded > 0, configured: true } as const;
  } catch {
    return { ok: false, configured: true } as const;
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyOrenzaMailTransport() {
  return Boolean(process.env.SMTP2GO_API_KEY && process.env.SMTP2GO_FROM_EMAIL);
}
