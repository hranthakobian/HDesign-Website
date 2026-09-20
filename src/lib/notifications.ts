import nodemailer from 'nodemailer';
import { getSubscribers, getSiteSetting } from './db';
import path from 'path';
import fsSync from 'fs';
import fs from 'fs/promises';

const SENT_EMAILS_FILE = path.join(process.cwd(), 'public', 'data', 'sent_emails.json');

// Helper to determine the site base URL dynamically
function getBaseUrl() {
  const isProd = process.env.NODE_ENV === 'production';
  return process.env.NEXT_PUBLIC_SITE_URL || (isProd ? 'https://hakobian.am' : 'http://localhost:3000');
}

async function getSmtpConfig() {
  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || '587', 10);
  let secure = process.env.SMTP_SECURE === 'true';
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || `"HDesign" <noreply@hakobian.am>`;

  try {
    const apiSettings = await getSiteSetting('api_settings');
    if (apiSettings) {
      if (apiSettings.smtp_host) host = apiSettings.smtp_host;
      if (apiSettings.smtp_port) port = parseInt(apiSettings.smtp_port, 10);
      if (apiSettings.smtp_secure !== undefined) {
        secure = apiSettings.smtp_secure === true || apiSettings.smtp_secure === 'true';
      }
      if (apiSettings.smtp_user) user = apiSettings.smtp_user;
      if (apiSettings.smtp_pass) pass = apiSettings.smtp_pass;
      if (apiSettings.smtp_from) from = apiSettings.smtp_from;
    }
  } catch (err) {
    console.warn('Failed to load SMTP configuration from database site settings:', err);
  }

  // Fallback to local settings.json if any key is missing and env doesn't have it
  if (!host || !user || !pass) {
    try {
      const settingsPath = path.join(process.cwd(), 'public', 'data', 'settings.json');
      if (fsSync.existsSync(settingsPath)) {
        const content = fsSync.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        if (settings.api_settings) {
          if (settings.api_settings.smtp_host) host = settings.api_settings.smtp_host;
          if (settings.api_settings.smtp_port) port = parseInt(settings.api_settings.smtp_port, 10);
          if (settings.api_settings.smtp_secure !== undefined) {
            secure = settings.api_settings.smtp_secure === true || settings.api_settings.smtp_secure === 'true';
          }
          if (settings.api_settings.smtp_user) user = settings.api_settings.smtp_user;
          if (settings.api_settings.smtp_pass) pass = settings.api_settings.smtp_pass;
          if (settings.api_settings.smtp_from) from = settings.api_settings.smtp_from;
        }
      }
    } catch (err) {
      console.warn('Failed to load SMTP configuration from settings.json:', err);
    }
  }

  return { host, port, secure, user, pass, from };
}

// Helper to get SMTP transporter
async function getTransporter() {
  const config = await getSmtpConfig();

  if (!config.host || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass }
  });
}

// Universal email sender
async function dispatchEmail(recipients: string[], subject: string, message: string, replyTo?: string, isHtml?: boolean) {
  const transporter = await getTransporter();
  const config = await getSmtpConfig();
  const fromEmail = config.from;
  const baseUrl = getBaseUrl();
  
  const emailRecord = {
    id: Math.random().toString(36).substring(2, 15),
    subject,
    message,
    recipients_count: recipients.length,
    recipients,
    sent_at: new Date().toISOString(),
    status: 'simulated'
  };

  if (transporter) {
    try {
      // Send actual emails
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #2d3748;">
          <h2 style="color: #6A3E73; border-bottom: 2px solid #6A3E73; padding-bottom: 12px; margin-top: 0;">HDesign</h2>
          <div style="font-size: 16px; line-height: 1.6; color: #2d3748; ${isHtml ? '' : 'white-space: pre-line;'}">
            ${message.replace(new RegExp(`(${baseUrl}/unsubscribe\\?email=[^\\s]+)`, 'g'), '<a href="$1" style="color: #ab47bc; font-weight: bold; text-decoration: underline;">Ապաբաժանորդագրվել</a>')}
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
            Այս նամակն ուղարկվել է HDesign ստուդիայի կողմից։
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: fromEmail,
        to: recipients.join(', '),
        replyTo: replyTo,
        subject,
        text: isHtml ? message.replace(/<[^>]*>/g, '') : message, // strip HTML tags for plain text fallback
        html: htmlContent
      });

      emailRecord.status = 'sent';
      console.log(`[SMTP EMAIL] Successfully sent: "${subject}" to ${recipients.length} recipients.`);
    } catch (err: any) {
      emailRecord.status = 'failed';
      console.error('[SMTP EMAIL ERROR] Failed to send email via SMTP:', err);
    }
  } else {
    // Simulated log in development
    console.log(`[SIMULATED EMAIL] Logged to history: "${subject}" to ${recipients.length} recipients.`);
  }

  // Save to sent_emails.json
  try {
    let sentEmails: any[] = [];
    try {
      const content = await fs.readFile(SENT_EMAILS_FILE, 'utf-8');
      sentEmails = JSON.parse(content);
    } catch {}
    sentEmails.unshift(emailRecord);
    await fs.mkdir(path.dirname(SENT_EMAILS_FILE), { recursive: true });
    await fs.writeFile(SENT_EMAILS_FILE, JSON.stringify(sentEmails, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error logging sent email history:', err);
  }
}

export async function sendWelcomeEmail(email: string) {
  const subject = 'Բաժանորդագրությունը հաստատված է | HDesign';
  const unsubscribeLink = `${getBaseUrl()}/unsubscribe?email=${encodeURIComponent(email)}`;
  const message = `Ողջույն,\n\nՇնորհակալություն HDesign-ին բաժանորդագրվելու համար: Դուք հաջողությամբ բաժանորդագրվել եք մեր նորություններին:\n\nԱպաբաժանորդագրվելու համար սեղմեք այստեղ՝ ${unsubscribeLink}`;

  await dispatchEmail([email], subject, message);
}

export async function notifySubscribers(type: 'case' | 'gallery' | 'font', name: string) {
  try {
    const subscribers = await getSubscribers();
    const recipientEmails = subscribers.map(s => s.email);

    if (recipientEmails.length === 0) return;

    let subject = '';
    let message = '';

    if (type === 'case') {
      subject = 'Նոր քեյս HDesign-ում';
      message = `Ողջույն,\n\nՈւրախ ենք տեղեկացնել, որ HDesign-ում ավելացվել է նոր քեյս (պրոյեկտ)՝ «${name}»։`;
    } else if (type === 'gallery') {
      subject = 'Նոր պատկեր HDesign պատկերասրահում';
      message = `Ողջույն,\n\nՈւրախ ենք տեղեկացնել, որ HDesign-ի պատկերասրահում ավելացվել է նոր պատկեր՝ «${name}»։`;
    } else if (type === 'font') {
      subject = 'Նոր տառատեսակ HDesign-ում';
      message = `Ողջույն,\n\nՈւրախ ենք տեղեկացնել, որ HDesign-ում ավելացվել է նոր տառատեսակ՝ «${name}»։`;
    }

    // Append standard unsubscribe note
    const campaignMessage = `${message}\n\n---\nԲաժանորդագրությունից դուրս գալու համար սեղմեք այստեղ՝ ${getBaseUrl()}/unsubscribe`;

    await dispatchEmail(recipientEmails, subject, campaignMessage);
  } catch (err) {
    console.error('Failed to notify subscribers:', err);
  }
}

export async function sendCampaignEmail({
  subject,
  message,
  cc,
  bcc
}: {
  subject: string;
  message: string;
  cc?: string;
  bcc?: string;
}) {
  const subscribers = await getSubscribers();
  const recipientEmails = subscribers.map(s => s.email);

  if (recipientEmails.length === 0) {
    throw new Error('No subscribers found.');
  }

  const transporter = await getTransporter();
  const config = await getSmtpConfig();
  const fromEmail = config.from;

  const emailRecord = {
    id: Math.random().toString(36).substring(2, 15),
    subject,
    message,
    cc: cc || '',
    bcc: bcc || '',
    recipients_count: recipientEmails.length,
    recipients: recipientEmails,
    sent_at: new Date().toISOString(),
    status: 'simulated'
  };

  if (transporter) {
    try {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #2d3748;">
          <h2 style="color: #6A3E73; border-bottom: 2px solid #6A3E73; padding-bottom: 12px; margin-top: 0;">HDesign</h2>
          <div style="font-size: 16px; line-height: 1.6; color: #2d3748; white-space: pre-line;">
            ${message}
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
            Այս նամակն ուղարկվել է HDesign ստուդիայի կողմից։
          </p>
        </div>
      `;

      // Compose mail options including CC/BCC
      const mailOptions: any = {
        from: fromEmail,
        to: recipientEmails.join(', '),
        subject,
        text: message,
        html: htmlContent
      };

      if (cc) mailOptions.cc = cc;
      if (bcc) mailOptions.bcc = bcc;

      await transporter.sendMail(mailOptions);
      emailRecord.status = 'sent';
      console.log(`[SMTP CAMPAIGN] Successfully sent: "${subject}" via SMTP.`);
    } catch (err: any) {
      emailRecord.status = 'failed';
      console.error('[SMTP CAMPAIGN ERROR] Failed to send campaign email via SMTP:', err);
    }
  } else {
    console.log(`[SIMULATED CAMPAIGN] Logged to history: "${subject}" to ${recipientEmails.length} recipients.`);
  }

  // Save to sent_emails.json
  try {
    let sentEmails: any[] = [];
    try {
      const content = await fs.readFile(SENT_EMAILS_FILE, 'utf-8');
      sentEmails = JSON.parse(content);
    } catch {}
    sentEmails.unshift(emailRecord);
    await fs.mkdir(path.dirname(SENT_EMAILS_FILE), { recursive: true });
    await fs.writeFile(SENT_EMAILS_FILE, JSON.stringify(sentEmails, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error logging campaign email history:', err);
  }

  return {
    success: emailRecord.status === 'sent' || emailRecord.status === 'simulated',
    status: emailRecord.status,
    recipients_count: recipientEmails.length,
    recipients: recipientEmails
  };
}

export async function sendContactEmails({
  name,
  email,
  message
}: {
  name: string;
  email: string;
  message: string;
}) {
  let adminEmail = 'hrant@hakobian.am';
  try {
    const generalSettings = await getSiteSetting('general_settings');
    if (generalSettings && generalSettings.contact_email) {
      adminEmail = generalSettings.contact_email;
    }
  } catch (err) {
    console.warn('Failed to load contact email from settings, falling back to default:', err);
  }
  
  // 1. Email to admin (hrant@hakobian.am)
  const adminSubject = `Նոր հաղորդագրություն կապի ձևից - ${name}`;
  const adminMessage = `Դուք ստացել եք նոր հաղորդագրություն HDesign կայքի կապի ձևից:\n\nԱնուն: ${name}\nԷլ. հասցե: ${email}\nՀաղորդագրություն:\n${message}`;
 
  // 2. Email to the user (confirmation)
  const userSubject = 'Ձեր հաղորդագրությունը ստացվել է | HDesign';
  const userMessage = `Ողջույն ${name},\n\nՇնորհակալություն HDesign-ին հաղորդագրություն ուղարկելու համար: Ձեր նամակը հաջողությամբ ստացվել է, և մենք շուտով կպատասխանենք ձեզ:\n\nՁեր ուղարկած հաղորդագրության պատճենը՝\n---\n${message}`;
 
  // Dispatch both emails (via SMTP or Mock fallback)
  await dispatchEmail([adminEmail], adminSubject, adminMessage, email);
  await dispatchEmail([email], userSubject, userMessage);
}

export async function sendReplyEmail({
  to,
  subject,
  message
}: {
  to: string;
  subject: string;
  message: string;
}) {
  await dispatchEmail([to], subject, message, undefined, true);
}

export async function sendBugReportEmails({
  report,
  appTitle
}: {
  report: {
    id: string;
    app_id: string;
    user_name: string;
    user_email: string;
    subject: string;
    description: string;
    version?: string;
    os?: string;
    media_files?: string[];
    created_at?: string;
  };
  appTitle: string;
}) {
  const adminEmail = 'hrant@hakobian.am';
  const baseUrl = getBaseUrl();

  // 1. Media files presentation
  let mediaListHtml = '<p style="color: #718096; font-style: italic; margin: 6px 0 0 0;">Կցված մեդիա նիշքեր չկան։</p>';

  if (report.media_files && report.media_files.length > 0) {
    const fullUrls = report.media_files.map(url => url.startsWith('http') ? url : `${baseUrl}${url}`);
    mediaListHtml = `
      <div style="margin-top: 14px;">
        <p style="font-weight: bold; margin: 0 0 8px 0; color: #2d3748;">Կցված մեդիա նիշքեր (${report.media_files.length})՝</p>
        <ul style="padding-left: 20px; margin: 0;">
          ${fullUrls.map(u => `
            <li style="margin-bottom: 6px;">
              <a href="${u}" target="_blank" rel="noopener noreferrer" style="color: #4a897c; font-weight: bold; text-decoration: underline;">
                ${u.split('/').pop() || u}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // 2. Email to Hrant (hrant@hakobian.am)
  const adminSubject = `[Վրեպի Զեկույց] ${appTitle} - ${report.subject}`;
  const adminMessage = `
    <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #2d3748;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e53e3e; padding-bottom: 12px; margin-bottom: 18px;">
        <h2 style="color: #c53030; margin: 0; font-size: 1.3rem;"> Նոր Վրեպի Զեկույց (Bug Report)</h2>
        <span style="font-size: 0.8rem; background: #fed7d7; color: #9b2c2c; padding: 4px 10px; border-radius: 20px; font-weight: bold;">
          ${report.id}
        </span>
      </div>

      <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;"><strong>Հավելված / Խրվակ՝</strong> <a href="${baseUrl}/apps/${report.app_id}" style="color: #4a897c; font-weight: bold; text-decoration: underline;">${appTitle}</a> (ID: ${report.app_id})</p>
        <p style="margin: 0 0 6px 0;"><strong>Օգտատեր՝</strong> ${report.user_name} (<a href="mailto:${report.user_email}" style="color: #3182ce;">${report.user_email}</a>)</p>
        <p style="margin: 0 0 6px 0;"><strong>Հավելվածի տարբերակ՝</strong> ${report.version || 'Չի նշված'}</p>
        <p style="margin: 0 0 6px 0;"><strong>Օպերացիոն համակարգ (OS)՝</strong> ${report.os || 'Չի նշված'}</p>
        <p style="margin: 0;"><strong>Ամսաթիվ՝</strong> ${new Date(report.created_at || Date.now()).toLocaleString('hy-AM')}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 1.1rem; color: #1a202c; margin: 0 0 8px 0;">Թեմա՝ ${report.subject}</h3>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #2d3748;">
          ${report.description}
        </div>
      </div>

      ${mediaListHtml}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <a href="${baseUrl}/admin" style="display: inline-block; background: #4a897c; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.9rem;">
          Բացել Վարիչի Վահանակում
        </a>
      </div>
    </div>
  `;

  // 3. Confirmation email to the user (from noreply@hakobian.am)
  const userSubject = `Ձեր զեկույցը ստացվել է | ${appTitle} | HDesign`;
  const userMessage = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #2d3748;">
      <h2 style="color: #4a897c; border-bottom: 2px solid #4a897c; padding-bottom: 12px; margin-top: 0;">HDesign</h2>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 14px;">
        Ողջույն <strong>${report.user_name}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #4a5568; margin-bottom: 16px;">
        Շնորհակալություն «<strong>${appTitle}</strong>» հավելվածի վերաբերյալ վրեպի / խնդրի մասին զեկուցելու համար: Ձեր հաղորդագրությունը հաջողությամբ ստացվել է և փոխանցվել է ծրագրավորողին ուսումնասիրման համար:
      </p>

      <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 6px 0; color: #718096; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Ձեր ուղարկած զեկույցի պատճենը՝</p>
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #2d3748;">Թեմա՝ ${report.subject}</p>
        <div style="white-space: pre-wrap; color: #4a5568; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">${report.description}</div>
      </div>

      <p style="font-size: 14px; color: #718096; line-height: 1.6;">
        Եթե լրացուցիչ տեղեկատվության կարիք լինի, մենք կկապվենք Ձեզ հետ այս էլ․ հասցեով:
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
        Այս նամակն ավտոմատ ուղարկվել է noreply@hakobian.am հասցեից: Խնդրում ենք չպատասխանել այս նամակին:
      </p>
    </div>
  `;

  // Dispatch both emails
  await dispatchEmail([adminEmail], adminSubject, adminMessage, report.user_email, true);
  await dispatchEmail([report.user_email], userSubject, userMessage, undefined, true);
}
