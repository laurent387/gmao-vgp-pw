import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = getEnv("SMTP_HOST");
  const port = Number(getEnv("SMTP_PORT"));
  const secure = parseBool(process.env.SMTP_SECURE, port === 465);
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("Missing environment variable: SMTP_FROM or SMTP_USER");
  }

  const transport = getTransporter();
  await transport.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
