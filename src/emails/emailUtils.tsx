import { render } from '@react-email/render';
import WelcomeEmail from './WelcomeEmail';

/**
 * Email Templates for use with Resend API
 *
 * Usage example:
 *
 * import { Resend } from 'resend';
 * import { renderEmailTemplate } from './src/emails/emailUtils';
 *
 * const resend = new Resend('your-api-key');
 *
 * const emailHtml = await renderEmailTemplate('welcome', {
 *   userName: 'John Doe',
 *   userEmail: 'john@example.com'
 * });
 *
 * await resend.emails.send({
 *   from: 'noreply@yourapp.com',
 *   to: 'user@example.com',
 *   subject: 'Welcome to MyHandyPlus!',
 *   html: emailHtml,
 * });
 */

// Define your email templates here
export const emailTemplates = {
	welcome: WelcomeEmail,
	// Add more templates as you create them
	// passwordReset: PasswordResetEmail,
	// accountDeleted: AccountDeletedEmail,
} as const;

export type EmailTemplateType = keyof typeof emailTemplates;

/**
 * Render an email template to HTML string
 * @param template - The template name
 * @param props - The props to pass to the template
 * @returns HTML string ready to send via Resend
 */
export async function renderEmailTemplate<T extends EmailTemplateType>(
	template: T,
	props: any
): Promise<string> {
	const Template = emailTemplates[template];
	return await render(<Template {...props} />);
}

/**
 * Get email subject lines for each template
 */
export const emailSubjects: Record<EmailTemplateType, string> = {
	welcome: 'Welcome to MyHandyPlus! 👋',
	// Add more subjects as you create templates
};

/**
 * Example usage with Resend in an edge function or API route:
 *
 * import { Resend } from 'resend';
 * import { renderEmailTemplate, emailSubjects } from './emails/emailUtils';
 *
 * const resend = new Resend(process.env.RESEND_API_KEY);
 *
 * // Send welcome email
 * const html = await renderEmailTemplate('welcome', {
 *   userName: user.firstName,
 *   userEmail: user.email,
 * });
 *
 * await resend.emails.send({
 *   from: 'MyHandyPlus <noreply@yourapp.com>',
 *   to: user.email,
 *   subject: emailSubjects.welcome,
 *   html: html,
 * });
 */
