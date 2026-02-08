import { describe, expect, test } from 'bun:test';
import { buildPublicPayload, generatePublicToken } from '../lib/businessCard.js';

describe('business card public payload', () => {
  test('hides email and phone when toggles are false', () => {
    const payload = buildPublicPayload(
      {
        user_id: 'u1',
        first_name: 'Jean',
        last_name: 'Dupont',
        job_title: 'Technicien',
        photo_url: null,
        email: 'jean@example.com',
        phone: '0600000000',
        is_email_public: false,
        is_phone_public: false,
        public_token: 'token',
        public_enabled: true,
      },
      {
        company_name: 'In-Spectra',
        company_logo_url: null,
        website_url: null,
      }
    );

    expect(payload.card.email).toBeUndefined();
    expect(payload.card.phone).toBeUndefined();
  });

  test('exposes email and phone when toggles are true', () => {
    const payload = buildPublicPayload(
      {
        user_id: 'u1',
        first_name: 'Jean',
        last_name: 'Dupont',
        job_title: 'Technicien',
        photo_url: null,
        email: 'jean@example.com',
        phone: '0600000000',
        is_email_public: true,
        is_phone_public: true,
        public_token: 'token',
        public_enabled: true,
      },
      {
        company_name: 'In-Spectra',
        company_logo_url: null,
        website_url: null,
      }
    );

    expect(payload.card.email).toBe('jean@example.com');
    expect(payload.card.phone).toBe('0600000000');
  });
});

describe('business card token', () => {
  test('generates unique tokens', () => {
    const first = generatePublicToken();
    const second = generatePublicToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(10);
    expect(second.length).toBeGreaterThan(10);
  });
});
