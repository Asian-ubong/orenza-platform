import 'server-only';

/**
 * ORENZA's provider-neutral transactional mail transport.
 *
 * Production is configured for SMTP2GO SMTP, but the application intentionally
 * talks only to SMTP here. This keeps OTP, KYC, and operational-report routes
 * independent from a provider SDK and allows a later move to another SMTP
 * provider or a self-hosted ORENZA mail server without rewriting those routes.
 *
 * Required environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
 *
 * SMTP2GO defaults:
 * SMTP_HOST=mail.smtp2go.com
 * SMTP_PORT=2525 (STARTTLS)
 */

import nodemailer from 'nodemailer';

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 2525);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password || !Number.isFinite(port)) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || port === 8465 || port === 443,
    requireTLS: port !== 465 && port !== 8465 && port !== 443,
    auth: { user, pass: password },
    tls: { minVersion: 'TLSv1.2' },
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

  if (!transport || !from) return { ok: false, configured: false } as const;

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
  } finally {
    transport.close();
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
  } finally {
    transport.close();
  }
}
