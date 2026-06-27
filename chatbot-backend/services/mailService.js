import nodemailer from "nodemailer";

const DEMO_VIDEO_URL = String(process.env.DEMO_VIDEO_URL || "").trim();

const REQUIRED_SMTP_ENV = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
];

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getSmtpConfig = () => {
  const missing = REQUIRED_SMTP_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  };
};

const createTransporter = () => {
  const config = getSmtpConfig();
  if (!config.configured) {
    return { transporter: null, config };
  }

  return {
    config,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
  };
};

export const verifyMailTransport = async () => {
  const { transporter, config } = createTransporter();
  if (!transporter) {
    console.warn("[mail] SMTP not configured", { missing: config.missing });
    return false;
  }

  try {
    await transporter.verify();
    console.log("[mail] SMTP transport verified");
    return true;
  } catch (error) {
    console.error("[mail] SMTP verification failed", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
    });
    return false;
  }
};

const buildWelcomeEmail = ({ name }) => {
  const safeName = escapeHtml(String(name || "").trim());
  const plainName = String(name || "").trim() || "there";
  const greeting = safeName ? `Dear ${safeName},` : "Dear user,";
  const demoVideoText = DEMO_VIDEO_URL
    ? `Watch the Demo Video: ${DEMO_VIDEO_URL}`
    : "Watch the Demo Video: Demo link coming soon";
  const demoVideoHtml = DEMO_VIDEO_URL
    ? `<a href="${DEMO_VIDEO_URL}" style="display:inline-block;background:#2f80ed;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">Watch the Demo Video</a>`
    : `<strong style="color:#2f2673;">Watch the Demo Video</strong>`;

  const text = [
    `Dear ${plainName},`,
    "",
    "Welcome to WrdsAI Nxt! Thank you for subscribing.",
    "Before you begin, we recommend watching our short demo video to help you get started and make the most of the platform.",
    "",
    demoVideoText,
    "",
    "If you have any questions or need assistance, feel free to contact us at support@wrdsai.com. Our team is always happy to help.",
    "We look forward to being a part of your learning journey.",
    "",
    "Warm regards,",
    "Team WrdsAI",
  ].join("\n");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;background:#2f2673;color:#ffffff;">
                    <h1 style="margin:0;font-size:24px;line-height:1.3;">Welcome to WrdsAI Nxt!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                      Welcome to WrdsAI Nxt! Thank you for subscribing.
                    </p>
                    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;">
                      Before you begin, we recommend watching our short demo video to help you get started and make the most of the platform.
                    </p>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                      ${demoVideoHtml}
                    </p>
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                      If you have any questions or need assistance, feel free to contact us at
                      <a href="mailto:support@wrdsai.com" style="color:#2563eb;">support@wrdsai.com</a>. Our team is always happy to help.
                    </p>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                      We look forward to being a part of your learning journey.
                    </p>
                    <p style="margin:0;font-size:16px;line-height:1.6;">
                      Warm regards,<br />
                      Team WrdsAI
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { html, text };
};

export const sendWelcomeEmail = async ({ email, name }) => {
  if (!email) {
    console.warn("[mail] Welcome email skipped: missing recipient");
    return false;
  }

  const { transporter, config } = createTransporter();
  if (!transporter) {
    console.warn("[mail] Welcome email skipped: SMTP not configured", {
      missing: config.missing,
      recipient: email,
    });
    return false;
  }

  const { html, text } = buildWelcomeEmail({ name });

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: email,
      subject: "Welcome to WrdsAI Nxt!",
      text,
      html,
    });

    console.log("[mail] Welcome email sent", {
      recipient: email,
      messageId: info.messageId,
    });
    return true;
  } catch (error) {
    console.error("[mail] Welcome email failed", {
      recipient: email,
      message: error?.message,
      code: error?.code,
      command: error?.command,
    });
    return false;
  }
};
