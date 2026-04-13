export async function verifyTurnstileToken(token: string, ip?: string) {
  const secret = process.env.NEXT_PUBLIC_TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, error: "Turnstile não configurado no servidor." };

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }),
  });

  const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!response.ok || !data?.success) {
    return { ok: false, error: "Falha na validação de segurança. Tente novamente." };
  }

  return { ok: true };
}
