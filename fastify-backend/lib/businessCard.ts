import { randomUUID } from 'crypto';

export interface BusinessCardRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  is_email_public: boolean;
  is_phone_public: boolean;
  public_token: string | null;
  public_enabled: boolean;
}

export interface CompanySettingsRow {
  company_name: string;
  company_logo_url: string | null;
  website_url: string | null;
}

export function generatePublicToken(): string {
  return randomUUID();
}

export function buildPublicPayload(card: BusinessCardRow, company: CompanySettingsRow | null) {
  const publicCard: Record<string, string | null> = {
    firstName: card.first_name,
    lastName: card.last_name,
    jobTitle: card.job_title,
    photoUrl: card.photo_url,
  };

  if (card.is_email_public && card.email) {
    publicCard.email = card.email;
  }

  if (card.is_phone_public && card.phone) {
    publicCard.phone = card.phone;
  }

  return {
    card: publicCard,
    company: {
      companyName: company?.company_name || '',
      companyLogoUrl: company?.company_logo_url || null,
      websiteUrl: company?.website_url || null,
    },
  };
}
