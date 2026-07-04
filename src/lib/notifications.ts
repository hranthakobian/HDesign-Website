import nodemailer from 'nodemailer';
import { getSubscribers } from './db';
import path from 'path';
import fs from 'fs/promises';

const SENT_EMAILS_FILE = path.join(process.cwd(), 'public', 'data', 'sent_emails.json');

// Helper to determine the site base URL dynamically
function getBaseUrl() {
  const isProd = process.env.NODE_ENV === 'production';
  return process.env.NEXT_PUBLIC_SITE_URL || (isProd ? 'https://hakobian.am' : 'http://localhost:3000');
}

// Helper to get SMTP transporter
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

// Universal email sender
async function dispatchEmail(recipients: string[], subject: string, message: string) {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || `"HDesign" <noreply@hakobian.am>`;
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
          <div style="font-size: 16px; line-height: 1.6; color: #2d3748; white-space: pre-line;">
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
        subject,
        text: message,
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

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || `"HDesign" <noreply@hakobian.am>`;

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
  const adminEmail = 'hrant@hakobian.am';
  
  // 1. Email to admin (hrant@hakobian.am)
  const adminSubject = `Նոր հաղորդագրություն կապի ձևից - ${name}`;
  const adminMessage = `Դուք ստացել եք նոր հաղորդագրություն HDesign կայքի կապի ձևից:\n\nԱնուն: ${name}\nԷլ. հասցե: ${email}\nՀաղորդագրություն:\n${message}`;

  // 2. Email to the user (confirmation)
  const userSubject = 'Ձեր հաղորդագրությունը ստացվել է | HDesign';
  const userMessage = `Ողջույն ${name},\n\nՇնորհակալություն HDesign-ին հաղորդագրություն ուղարկելու համար: Ձեր նամակը հաջողությամբ ստացվել է, և մենք շուտով կպատասխանենք ձեզ:\n\nՁեր ուղարկած հաղորդագրության պատճենը՝\n---\n${message}`;

  // Dispatch both emails (via SMTP or Mock fallback)
  await dispatchEmail([adminEmail], adminSubject, adminMessage);
  await dispatchEmail([email], userSubject, userMessage);
}
