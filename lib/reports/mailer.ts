import 'server-only';

/**
 * ORENZA's provider-neutral mail transport.
 *
 * The application intentionally does not depend on Resend or another
 * transactional-email SaaS. Delivery is delegated to the SMTP server
 * configured for ORENZA (self-hosted or otherwise controlled by ORENZA).
 *
 * Required environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
 */

import nodemailer from 'nodemailer';

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password || !Number.isFinite(port)) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

export async function sendOrenzaEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const from = process.env.SMTP_FROM_EMAIL;
  const transport = getTransport();

  if (!transport || !from) {
    return { ok: false, configured: false } as const;
  }

  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    return { ok: true, configured: true } as const;
  } catch {
    return { ok: false, configured: true } as const;
  }
}

export async function verifyOrenzaMailTransport() {
  const transport = getTransport();
  if (!transport || !process.env.SMTP_FROM_EMAIL) return false;
  try {
    await transport.verify();
    return true;
  } catch {
    return false;
  }
}
