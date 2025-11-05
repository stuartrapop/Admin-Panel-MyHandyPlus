import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text
} from '@react-email/components';

interface WelcomeEmailProps {
	userName?: string;
	userEmail?: string;
}

export const WelcomeEmail = ({
	userName = 'there',
	userEmail = 'user@example.com',
}: WelcomeEmailProps) => (
	<Html>
		<Head />
		<Preview>Welcome to MyHandyPlus - Your journey starts here!</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={logoSection}>
					<Heading style={h1}>MyHandyPlus</Heading>
				</Section>

				<Section style={contentSection}>
					<Heading style={h2}>Welcome {userName}! 👋</Heading>

					<Text style={text}>
						We're excited to have you join our community. MyHandyPlus is the perfect place to connect with like-minded people and build meaningful relationships.
					</Text>

					<Text style={text}>
						Here's what you can do to get started:
					</Text>

					<ul style={list}>
						<li style={listItem}>Complete your profile</li>
						<li style={listItem}>Upload your best photos</li>
						<li style={listItem}>Set your preferences</li>
						<li style={listItem}>Start browsing profiles</li>
					</ul>

					<Section style={buttonSection}>
						<Button
							style={button}
							href="https://yourapp.com/profile"
						>
							Complete Your Profile
						</Button>
					</Section>

					<Text style={text}>
						If you have any questions, feel free to reach out to our support team.
					</Text>

					<Text style={footer}>
						Welcome aboard!<br />
						The MyHandyPlus Team
					</Text>
				</Section>

				<Section style={footerSection}>
					<Text style={footerText}>
						© 2025 MyHandyPlus. All rights reserved.<br />
						You're receiving this email because you signed up for MyHandyPlus.
					</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

export default WelcomeEmail;

// Styles
const main = {
	backgroundColor: '#f6f9fc',
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: '#ffffff',
	margin: '0 auto',
	padding: '20px 0 48px',
	marginBottom: '64px',
};

const logoSection = {
	padding: '32px',
	textAlign: 'center' as const,
	backgroundColor: '#1976d2',
};

const h1 = {
	color: '#ffffff',
	fontSize: '32px',
	fontWeight: 'bold',
	margin: '0',
	padding: '0',
};

const contentSection = {
	padding: '0 48px',
};

const h2 = {
	color: '#333',
	fontSize: '24px',
	fontWeight: 'bold',
	margin: '40px 0 20px',
};

const text = {
	color: '#333',
	fontSize: '16px',
	lineHeight: '26px',
	margin: '16px 0',
};

const list = {
	color: '#333',
	fontSize: '16px',
	lineHeight: '26px',
	marginLeft: '20px',
};

const listItem = {
	marginBottom: '8px',
};

const buttonSection = {
	textAlign: 'center' as const,
	margin: '32px 0',
};

const button = {
	backgroundColor: '#1976d2',
	borderRadius: '4px',
	color: '#fff',
	fontSize: '16px',
	fontWeight: 'bold',
	textDecoration: 'none',
	textAlign: 'center' as const,
	display: 'inline-block',
	padding: '12px 32px',
};

const footer = {
	color: '#666',
	fontSize: '14px',
	lineHeight: '24px',
	marginTop: '32px',
};

const footerSection = {
	padding: '0 48px',
	marginTop: '32px',
	borderTop: '1px solid #eaeaea',
	paddingTop: '32px',
};

const footerText = {
	color: '#999',
	fontSize: '12px',
	lineHeight: '20px',
	textAlign: 'center' as const,
};
