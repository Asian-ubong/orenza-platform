const RESEND_API_URL = "https://api.resend.com/emails";

export type VerificationEmailInput = {
  to: string;
  code: string;
  verificationUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function sendVerificationEmail({
  to,
  code,
  verificationUrl,
}: VerificationEmailInput) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = process.env.ORENZA_VERIFY_FROM ?? "ORENZA Verification <verify@orenzateac.com>";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Verify your ORENZA account",
      html: verificationEmailHtml({ code, verificationUrl }),
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Resend request failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }

  return payload as { id?: string };
}

function verificationEmailHtml({
  code,
  verificationUrl,
}: Pick<VerificationEmailInput, "code" | "verificationUrl">) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f3e8;font-family:Arial,sans-serif;color:#18352a">
    <div style="max-width:560px;margin:40px auto;padding:32px;background:#fff;border-radius:16px">
      <p style="font-size:13px;letter-spacing:2px;font-weight:700">ORENZA</p>
      <h1 style="margin-bottom:8px">Verify your email</h1>
      <p>Use the verification code below to finish creating your ORENZA account.</p>
      <div style="margin:28px 0;padding:18px;text-align:center;background:#f3efe2;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:8px">${code}</div>
      <p style="font-size:14px">You can also verify your email directly:</p>
      <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#18352a;color:#fff;text-decoration:none;border-radius:8px">Verify My Email</a></p>
      <p style="font-size:12px;color:#68756f;margin-top:28px">If you did not create an ORENZA account, you can ignore this email.</p>
    </div>
  </body>
</html>`;
}
