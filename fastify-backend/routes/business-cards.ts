import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { buildPublicPayload, generatePublicToken, type BusinessCardRow } from '../lib/businessCard.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value?: string | null) => !value || EMAIL_REGEX.test(value);

const isValidUrl = (value?: string | null) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidPhone = (value?: string | null) => {
  if (!value) return true;
  return /^[+()\d\s.-]{6,}$/.test(value);
};

const normalizeText = (value?: string | null) => {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function splitName(fullName?: string | null) {
  const raw = (fullName || '').trim();
  if (!raw) return { firstName: null, lastName: null };
  const parts = raw.split(/\s+/g);
  const firstName = parts[0] || null;
  const lastName = parts.slice(1).join(' ') || null;
  return { firstName, lastName };
}

async function getAuthUser(request: any, reply: any) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized' });
    return null;
  }

  try {
    const decoded = (await request.jwtVerify()) as any;
    const userId = decoded.userId || decoded.sub || decoded.id;
    const role = decoded.role;

    if (!userId) {
      reply.code(401).send({ error: 'Invalid token' });
      return null;
    }

    return { userId, role };
  } catch (error) {
    reply.code(401).send({ error: 'Invalid token' });
    return null;
  }
}

async function ensureCompanySettings(db: Client) {
  const res = await db.query('SELECT * FROM company_settings WHERE id = 1');
  if (res.rows.length > 0) return res.rows[0];

  const insert = await db.query(
    "INSERT INTO company_settings (id, company_name) VALUES (1, '') RETURNING *"
  );
  return insert.rows[0];
}

async function ensureBusinessCard(db: Client, userId: string) {
  const existing = await db.query('SELECT * FROM user_business_card WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) return existing.rows[0] as BusinessCardRow;

  const userRes = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return null;

  const { firstName, lastName } = splitName(userRes.rows[0].name);
  const publicToken = generatePublicToken();

  const insert = await db.query(
    `INSERT INTO user_business_card (
      user_id,
      first_name,
      last_name,
      email,
      public_token,
      public_enabled
    ) VALUES ($1, $2, $3, $4, $5, false)
    RETURNING *`,
    [userId, firstName, lastName, userRes.rows[0].email || null, publicToken]
  );

  return insert.rows[0] as BusinessCardRow;
}

function mapBusinessCardRow(card: BusinessCardRow) {
  return {
    userId: card.user_id,
    firstName: card.first_name,
    lastName: card.last_name,
    jobTitle: card.job_title,
    photoUrl: card.photo_url,
    email: card.email,
    phone: card.phone,
    isEmailPublic: card.is_email_public,
    isPhonePublic: card.is_phone_public,
    publicToken: card.public_token,
    publicEnabled: card.public_enabled,
  };
}

export async function businessCardRoutes(fastify: FastifyInstance, db: Client) {
  fastify.get('/admin/company', async (request, reply) => {
    const auth = await getAuthUser(request, reply);
    if (!auth) return;
    if (auth.role !== 'ADMIN') return reply.code(403).send({ error: 'Forbidden' });

    const settings = await ensureCompanySettings(db);
    return settings;
  });

  fastify.put('/admin/company', async (request, reply) => {
    const auth = await getAuthUser(request, reply);
    if (!auth) return;
    if (auth.role !== 'ADMIN') return reply.code(403).send({ error: 'Forbidden' });

    const body = request.body as any;
    const updates: Record<string, unknown> = {};

    if ('companyName' in body) {
      const rawName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
      updates.company_name = rawName;
    }
    if ('companyLogoUrl' in body) {
      if (!isValidUrl(body.companyLogoUrl)) {
        return reply.code(400).send({ error: 'Invalid companyLogoUrl' });
      }
      updates.company_logo_url = normalizeText(body.companyLogoUrl);
    }
    if ('websiteUrl' in body) {
      if (!isValidUrl(body.websiteUrl)) {
        return reply.code(400).send({ error: 'Invalid websiteUrl' });
      }
      updates.website_url = normalizeText(body.websiteUrl);
    }
    if ('addressLine1' in body) updates.address_line1 = normalizeText(body.addressLine1);
    if ('addressLine2' in body) updates.address_line2 = normalizeText(body.addressLine2);
    if ('postalCode' in body) updates.postal_code = normalizeText(body.postalCode);
    if ('city' in body) updates.city = normalizeText(body.city);
    if ('country' in body) updates.country = normalizeText(body.country);
    if ('phone' in body) {
      if (!isValidPhone(body.phone)) {
        return reply.code(400).send({ error: 'Invalid phone' });
      }
      updates.phone = normalizeText(body.phone);
    }
    if ('email' in body) {
      if (!isValidEmail(body.email)) {
        return reply.code(400).send({ error: 'Invalid email' });
      }
      updates.email = normalizeText(body.email);
    }
    if ('legalName' in body) updates.legal_name = normalizeText(body.legalName);
    if ('siret' in body) updates.siret = normalizeText(body.siret);
    if ('primaryColor' in body) updates.primary_color = normalizeText(body.primaryColor);

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'No updates provided' });
    }

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const columns = ['id', ...keys];
    const params = columns.map((_, index) => `$${index + 1}`).join(', ');
    const set = keys.map((key) => `${key} = EXCLUDED.${key}`).join(', ');

    const sql = `
      INSERT INTO company_settings (${columns.join(', ')})
      VALUES (${params})
      ON CONFLICT (id)
      DO UPDATE SET ${set}, updated_at = NOW()
      RETURNING *
    `;

    const res = await db.query(sql, [1, ...values]);
    return res.rows[0];
  });

  fastify.get('/me/business-card', async (request, reply) => {
    const auth = await getAuthUser(request, reply);
    if (!auth) return;

    const card = await ensureBusinessCard(db, auth.userId);
    if (!card) return reply.code(404).send({ error: 'User not found' });

    return mapBusinessCardRow(card);
  });

  fastify.put('/me/business-card', async (request, reply) => {
    const auth = await getAuthUser(request, reply);
    if (!auth) return;

    const card = await ensureBusinessCard(db, auth.userId);
    if (!card) return reply.code(404).send({ error: 'User not found' });

    const body = request.body as any;
    const updates: Record<string, unknown> = {};

    if ('firstName' in body) updates.first_name = normalizeText(body.firstName);
    if ('lastName' in body) updates.last_name = normalizeText(body.lastName);
    if ('jobTitle' in body) updates.job_title = normalizeText(body.jobTitle);
    if ('photoUrl' in body) {
      if (!isValidUrl(body.photoUrl)) {
        return reply.code(400).send({ error: 'Invalid photoUrl' });
      }
      updates.photo_url = normalizeText(body.photoUrl);
    }
    if ('email' in body) {
      if (!isValidEmail(body.email)) {
        return reply.code(400).send({ error: 'Invalid email' });
      }
      updates.email = normalizeText(body.email);
    }
    if ('phone' in body) {
      if (!isValidPhone(body.phone)) {
        return reply.code(400).send({ error: 'Invalid phone' });
      }
      updates.phone = normalizeText(body.phone);
    }
    if ('isEmailPublic' in body) updates.is_email_public = Boolean(body.isEmailPublic);
    if ('isPhonePublic' in body) updates.is_phone_public = Boolean(body.isPhonePublic);
    if ('publicEnabled' in body) updates.public_enabled = Boolean(body.publicEnabled);

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'No updates provided' });
    }

    if (updates.public_enabled && !card.public_token) {
      updates.public_token = generatePublicToken();
    }

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const set = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    const sql = `UPDATE user_business_card SET ${set}, updated_at = NOW() WHERE user_id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, auth.userId]);

    return mapBusinessCardRow(res.rows[0]);
  });

  fastify.post('/me/business-card/rotate-token', async (request, reply) => {
    const auth = await getAuthUser(request, reply);
    if (!auth) return;

    const card = await ensureBusinessCard(db, auth.userId);
    if (!card) return reply.code(404).send({ error: 'User not found' });

    const publicToken = generatePublicToken();
    const res = await db.query(
      `UPDATE user_business_card
       SET public_token = $1, public_enabled = true, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [publicToken, auth.userId]
    );

    return mapBusinessCardRow(res.rows[0]);
  });

  fastify.post('/me/business-card/disable-public', async (request, reply) => {
    const auth = await getAuthUser(request, reply);
    if (!auth) return;

    const card = await ensureBusinessCard(db, auth.userId);
    if (!card) return reply.code(404).send({ error: 'User not found' });

    const res = await db.query(
      `UPDATE user_business_card
       SET public_enabled = false, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [auth.userId]
    );

    return mapBusinessCardRow(res.rows[0]);
  });

  fastify.get('/public/u/:token', async (request, reply) => {
    const { token } = request.params as any;

    const res = await db.query(
      'SELECT * FROM user_business_card WHERE public_token = $1 AND public_enabled = true',
      [token]
    );

    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });

    const company = await ensureCompanySettings(db);
    const payload = buildPublicPayload(res.rows[0], company);

    console.info('[public-card] json', { token, ip: request.ip });
    return payload;
  });

  fastify.get('/u/:token', async (request, reply) => {
    const { token } = request.params as any;

    const res = await db.query(
      'SELECT * FROM user_business_card WHERE public_token = $1 AND public_enabled = true',
      [token]
    );

    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });

    const company = await ensureCompanySettings(db);
    const payload = buildPublicPayload(res.rows[0], company);

    const card = payload.card;
    const companyInfo = payload.company;

    const companyName = escapeHtml(companyInfo.companyName || 'Entreprise');
    const fullName = escapeHtml(`${card.firstName || ''} ${card.lastName || ''}`.trim() || 'Profil');
    const jobTitle = card.jobTitle ? escapeHtml(card.jobTitle) : '';
    const email = card.email ? escapeHtml(card.email) : '';
    const phone = card.phone ? escapeHtml(card.phone) : '';
    const photoUrl = card.photoUrl ? escapeHtml(card.photoUrl) : '';
    const logoUrl = companyInfo.companyLogoUrl ? escapeHtml(companyInfo.companyLogoUrl) : '';
    const websiteUrl = companyInfo.websiteUrl ? escapeHtml(companyInfo.websiteUrl) : '';

    const baseUrl = process.env.PUBLIC_WEB_BASE_URL || process.env.FRONTEND_URL || 'https://app.in-spectra.com';
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/u/${encodeURIComponent(token)}`;

    const ogImage = logoUrl || photoUrl;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${fullName} | ${companyName}</title>
  <meta name="description" content="Carte de visite de ${fullName}" />
  <meta property="og:title" content="${fullName} | ${companyName}" />
  <meta property="og:description" content="Carte de visite de ${fullName}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(publicUrl)}" />
  ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
  <style>
    :root {
      color-scheme: light;
      --brand: #1b4d3e;
      --ink: #0d1b2a;
      --muted: #5f6b7a;
      --card: #ffffff;
      --border: #e1e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Space Grotesk", "Segoe UI", sans-serif;
      color: var(--ink);
      background: radial-gradient(circle at top, #f0f7f4 0%, #f8fafc 55%, #eef2f7 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .card {
      width: min(520px, 92vw);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
      display: grid;
      gap: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 4px 0;
    }
    .brand img {
      height: 56px;
      max-width: 180px;
      object-fit: contain;
      object-position: left center;
    }
    .brand h2 { margin: 0; font-size: 18px; letter-spacing: 0.4px; font-weight: 600; }
    .profile {
      display: grid;
      gap: 10px;
    }
    .avatar {
      height: 96px;
      width: 96px;
      border-radius: 50%;
      background: #e2e8f0;
      overflow: hidden;
      display: grid;
      place-items: center;
    }
    .avatar img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
    .name {
      font-size: 26px;
      font-weight: 600;
    }
    .job {
      font-size: 16px;
      color: var(--muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .actions a {
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--ink);
      font-weight: 500;
      transition: transform 0.15s ease;
    }
    .actions a.primary {
      background: var(--brand);
      border-color: var(--brand);
      color: #fff;
    }
    .actions a:hover { transform: translateY(-1px); }
    .meta { font-size: 13px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" />` : ''}
      <div>
        <h2>${companyName}</h2>
        ${websiteUrl ? `<div class="meta">${websiteUrl}</div>` : ''}
      </div>
    </div>

    <div class="profile">
      <div class="avatar">
        ${photoUrl ? `<img src="${photoUrl}" alt="${fullName}" />` : '<span></span>'}
      </div>
      <div class="name">${fullName}</div>
      ${jobTitle ? `<div class="job">${jobTitle}</div>` : ''}
    </div>

    <div class="actions">
      ${phone ? `<a class="primary" href="tel:${phone}">Appeler</a>` : ''}
      ${email ? `<a href="mailto:${email}">Envoyer email</a>` : ''}
      ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" rel="noopener">Site web</a>` : ''}
    </div>
  </div>
</body>
</html>`;

    console.info('[public-card] html', { token, ip: request.ip });
    reply.type('text/html').send(html);
  });
}
