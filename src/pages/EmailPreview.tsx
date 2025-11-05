import { Box, Card, CardContent, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { render } from '@react-email/render';
import { useEffect, useState } from 'react';
import { Title } from 'react-admin';
import WelcomeEmail from '../emails/WelcomeEmail';

// Define available email templates
const emailTemplates = {
	welcome: {
		name: 'Welcome Email',
		component: WelcomeEmail,
		props: {
			userName: 'John Doe',
			userEmail: 'john@example.com',
		},
	},
	// Add more templates here as you create them
};

type EmailTemplateKey = keyof typeof emailTemplates;

export const EmailPreview = () => {
	const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateKey>('welcome');
	const [templateProps, setTemplateProps] = useState(emailTemplates.welcome.props);
	const [emailHtml, setEmailHtml] = useState<string>('');

	const handleTemplateChange = (template: EmailTemplateKey) => {
		setSelectedTemplate(template);
		setTemplateProps(emailTemplates[template].props);
	};

	const handlePropChange = (key: string, value: string) => {
		setTemplateProps(prev => ({
			...prev,
			[key]: value,
		}));
	};

	// Render the email HTML whenever template or props change
	useEffect(() => {
		const renderEmail = async () => {
			// Get the selected template component
			const TemplateComponent = emailTemplates[selectedTemplate].component;

			// Render the email as HTML
			const html = await render(<TemplateComponent {...templateProps} />);
			setEmailHtml(html);
		};

		renderEmail();
	}, [selectedTemplate, templateProps]);

	return (
		<Box p={3}>
			<Title title="Email Templates Preview" />
			<Typography variant="h4" gutterBottom>
				Email Templates
			</Typography>
			<Typography variant="body1" color="textSecondary" paragraph>
				Preview and test your email templates with different data
			</Typography>

			<Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
				{/* Controls Panel */}
				<Box sx={{ flex: '0 0 300px' }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Template Settings
							</Typography>

							{/* Template Selector */}
							<FormControl fullWidth sx={{ mb: 3 }}>
								<InputLabel>Select Template</InputLabel>
								<Select
									value={selectedTemplate}
									label="Select Template"
									onChange={(e) => handleTemplateChange(e.target.value as EmailTemplateKey)}
								>
									{Object.entries(emailTemplates).map(([key, template]) => (
										<MenuItem key={key} value={key}>
											{template.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Dynamic Props Editor */}
							<Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
								Template Data
							</Typography>
							{Object.entries(templateProps).map(([key, value]) => (
								<TextField
									key={key}
									fullWidth
									label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
									value={value}
									onChange={(e) => handlePropChange(key, e.target.value)}
									sx={{ mb: 2 }}
									size="small"
								/>
							))}

							<Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
								💡 Edit the values above to see the email update in real-time
							</Typography>
						</CardContent>
					</Card>
				</Box>

				{/* Email Preview */}
				<Box sx={{ flex: 1 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Preview
							</Typography>
							<Box
								sx={{
									border: '1px solid #e0e0e0',
									borderRadius: 1,
									overflow: 'auto',
									backgroundColor: '#f6f9fc',
									minHeight: '600px',
								}}
							>
								<iframe
									srcDoc={emailHtml}
									style={{
										width: '100%',
										minHeight: '600px',
										border: 'none',
									}}
									title="Email Preview"
								/>
							</Box>
						</CardContent>
					</Card>

					{/* HTML Code Preview */}
					<Card sx={{ mt: 2 }}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								HTML Code
							</Typography>
							<Typography variant="caption" color="textSecondary" gutterBottom>
								Copy this HTML to use with Resend API
							</Typography>
							<Box
								sx={{
									backgroundColor: '#1e1e1e',
									color: '#d4d4d4',
									padding: 2,
									borderRadius: 1,
									overflow: 'auto',
									maxHeight: '300px',
									fontSize: '12px',
									fontFamily: 'monospace',
								}}
							>
								<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
									{emailHtml}
								</pre>
							</Box>
						</CardContent>
					</Card>
				</Box>
			</Box>
		</Box>
	);
};
