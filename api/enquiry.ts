import { createHash } from 'node:crypto';

export const config = { runtime: 'nodejs' };

const WEBSITE_TYPES = [
  'Business website',
  'Landing page',
  'Portfolio website',
  'Website redesign',
  'Responsive design',
  'Contact form or database integration',
  'Not sure yet',
];
const MAX_BODY_BYTES = 8_000;

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });

const clean = (value: unknown, max: number) => {
  if (typeof value !== 'string') return '';
  return Array.from(value).filter((character) => {
    const code = character.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
  }).join('').trim().slice(0, max + 1);
};

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const salt = process.env.RATE_LIMIT_SALT;
  if (!url || !key || !salt || salt.length < 32) return null;
  return { url: url.replace(/\/$/, ''), key, salt };
}

export async function POST(request: Request): Promise<Response> {
  const cfg = getConfig();
  if (!cfg) return json({ ok: false, code: 'not_configured', message: 'Enquiry storage is not configured yet.' }, 503);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || new URL(request.url).origin)
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins.includes(origin)) return json({ ok: false, code: 'forbidden' }, 403);

  if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json'))
    return json({ ok: false, code: 'bad_request', message: 'Unsupported content type.' }, 415);
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES)
    return json({ ok: false, code: 'too_large' }, 413);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
    return json({ ok: false, code: 'too_large' }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid payload');
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, code: 'bad_request', message: 'Invalid request.' }, 400);
  }

  if (clean(body.company_website, 50) || (typeof body.elapsedMs === 'number' && body.elapsedMs < 2500))
    return json({ ok: false, code: 'rejected', message: 'Your enquiry could not be accepted.' }, 400);

  const name = clean(body.name, 100);
  const businessName = clean(body.businessName, 120);
  const contact = clean(body.contact, 160);
  const websiteType = clean(body.websiteType, 100);
  const message = clean(body.message, 2000);
  const fieldErrors: Record<string, string> = {};

  if (name.length < 1 || name.length > 100) fieldErrors.name = 'Please enter your name (up to 100 characters).';
  if (businessName.length > 120) fieldErrors.businessName = 'Business name is too long.';
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const digits = contact.replace(/\D/g, '');
  const isPhone = /^[+\d][\d\s\-()]{5,}$/.test(contact) && digits.length >= 7 && digits.length <= 15;
  if (!contact || contact.length > 160 || (!isEmail && !isPhone))
    fieldErrors.contact = 'Enter a valid email address or phone number.';
  if (!WEBSITE_TYPES.includes(websiteType)) fieldErrors.websiteType = 'Please choose a website type.';
  if (message.length < 10 || message.length > 2000)
    fieldErrors.message = 'Please describe your project (10–2000 characters).';
  if (body.consent !== true) fieldErrors.consent = 'Please agree so I can use your details to reply.';
  if (Object.keys(fieldErrors).length) return json({ ok: false, code: 'validation', fieldErrors }, 422);

  const ip = (request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown')
    .split(',')[0].trim();
  const ipHash = createHash('sha256').update(`${cfg.salt}:${ip}`).digest('hex');
  const headers = { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` };

  try {
    const rateLimit = await fetch(`${cfg.url}/rest/v1/rpc/consume_enquiry_rate_limit`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_ip_hash: ipHash }),
    });
    if (!rateLimit.ok) throw new Error('Rate-limit service unavailable');
    if (await rateLimit.json() !== true)
      return json({ ok: false, code: 'rate_limited', message: 'Too many enquiries just now. Please try again later.' }, 429, { 'Retry-After': '3600' });

    const response = await fetch(`${cfg.url}/rest/v1/enquiries`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        name,
        business_name: businessName || null,
        business_type: websiteType,
        subject: websiteType,
        email: isEmail ? contact : null,
        phone: isEmail ? null : contact,
        requirements: message,
        consent_at: new Date().toISOString(),
        ip_hash: ipHash,
        source: 'portfolio-site',
      }),
    });
    if (!response.ok) throw new Error(`Enquiry insert failed (${response.status})`);
    return json({ ok: true });
  } catch (error) {
    console.error('enquiry error:', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, code: 'server_error', message: 'Your enquiry could not be saved. Please try again or contact me directly.' }, 502);
  }
}

export function GET(): Response {
  return json({ ok: false, code: 'method_not_allowed' }, 405, { Allow: 'POST' });
}
