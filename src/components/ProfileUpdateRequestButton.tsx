import EmailIcon from "@mui/icons-material/Email";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";
import { useNotify, useRecordContext } from "react-admin";
import { supabase } from "../supabaseClient";

interface ProfileUpdateRequestButtonProps {
	type: 'profile-warning-photo' | 'profile-warning-bio' | 'profile-warning-improvement';
}

const LABEL_MAP: Record<string, string> = {
	'profile-warning-photo': 'Photo Update Request',
	'profile-warning-bio': 'Bio Update Request',
	'profile-warning-improvement': 'Profile Improvement Request',
};

const PLACEHOLDER_MAP: Record<string, string> = {
	'profile-warning-photo': 'e.g. profile photo does not show your face clearly...',
	'profile-warning-bio': 'e.g. bio too short, please add more details about yourself...',
	'profile-warning-improvement': 'e.g. please complete your profile by adding more information...',
};

export const ProfileUpdateRequestButton = ({ type }: ProfileUpdateRequestButtonProps) => {
	const record = useRecordContext();
	const notify = useNotify();
	const [open, setOpen] = useState(false);
	const [additionalInfo, setAdditionalInfo] = useState('');
	const [loading, setLoading] = useState(false);

	const label = LABEL_MAP[type];
	const placeholder = PLACEHOLDER_MAP[type];

	const handleSend = async () => {
		if (!record?.id) return;

		if (!additionalInfo.trim()) {
			notify('Please enter a message for the user', { type: 'warning' });
			return;
		}

		setLoading(true);
		try {
			const { error } = await supabase.from('email_queue').insert({
				receiver_uuid: record.id,
				receiver_email: record.email || null,
				receiver_firstname: record.firstname || null,
				other_uuid: null,
				other_email: null,
				other_firstname: null,
				type,
				additional_info: additionalInfo.trim(),
			});

			if (error) {
				console.error('Error inserting into email_queue:', error);
				notify(`Failed to send request: ${error.message}`, { type: 'error' });
				return;
			}

			notify(`${label} sent successfully`, { type: 'success' });
			setOpen(false);
			setAdditionalInfo('');
		} catch (err) {
			console.error('Unexpected error:', err);
			notify('An unexpected error occurred', { type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setOpen(false);
		setAdditionalInfo('');
	};

	return (
		<>
			<Button
				variant="contained"
				color="warning"
				startIcon={<EmailIcon />}
				onClick={() => setOpen(true)}
				fullWidth
			>
				{label}
			</Button>

			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle>Send {label}</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2 }}>
						This will send a <strong>{type}</strong> email to <strong>{record?.firstname}</strong> ({record?.email}).
					</DialogContentText>
					<TextField
						autoFocus
						fullWidth
						multiline
						rows={5}
						label="Message to user"
						placeholder={placeholder}
						value={additionalInfo}
						onChange={(e) => setAdditionalInfo(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						onClick={handleSend}
						variant="contained"
						color="warning"
						disabled={loading || !additionalInfo.trim()}
						startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <EmailIcon />}
					>
						{loading ? 'Sending...' : 'Send'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};
