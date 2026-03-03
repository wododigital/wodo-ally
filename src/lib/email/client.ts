import nodemailer from "nodemailer";

export function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.office365.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER ?? "accounts@wodo.digital",
      pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? "",
    },
    tls: {
      ciphers: "SSLv3",
    },
  });
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}): Promise<void> {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"WODO Digital" <${process.env.SMTP_USER ?? "accounts@wodo.digital"}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}
