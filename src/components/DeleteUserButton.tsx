import DeleteIcon from "@mui/icons-material/Delete";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNotify, useRecordContext, useRedirect, useRefresh } from "react-admin";
import { supabase } from "../supabaseClient";

export const DeleteUserButton = () => {
	const record = useRecordContext();
	const notify = useNotify();
	const refresh = useRefresh();
	const redirect = useRedirect();
	const [loading, setLoading] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<string | null>(null);
	const [openDialog, setOpenDialog] = useState(false);
	const [openWarningDialog, setOpenWarningDialog] = useState(false);
	const [fetchingStatus, setFetchingStatus] = useState(false);

	// Deletion form fields
	const [deletionReason, setDeletionReason] = useState<string>('');
	const [deletionDetails, setDeletionDetails] = useState<string>('');

	// Function to fetch the user's current status
	const fetchStatus = useCallback(async () => {
		if (!record?.id) return null;

		const { data, error } = await supabase
			.from('user_account_status')
			.select('status')
			.eq('user_id', record.id)
			.single();

		if (error && error.code !== 'PGRST116') {
			console.error('Error fetching status:', error);
			return 'active'; // Default to active on error
		} else if (data) {
			return data.status;
		} else {
			// No status record exists, default to active
			return 'active';
		}
	}, [record?.id]);

	// Fetch status on mount
	useEffect(() => {
		const loadStatus = async () => {
			const status = await fetchStatus();
			if (status) setCurrentStatus(status);
		};
		loadStatus();
	}, [fetchStatus]);

	const handleDeleteClick = async () => {
		// Re-fetch the status to ensure we have the latest data
		setFetchingStatus(true);
		const latestStatus = await fetchStatus();
		setCurrentStatus(latestStatus);
		setFetchingStatus(false);

		// Check if user is banned
		if (latestStatus !== 'banned') {
			setOpenWarningDialog(true);
		} else {
			setOpenDialog(true);
		}
	};

	const handleConfirmDelete = async () => {
		if (!record?.id) return;

		// Validate that deletion reason is provided
		if (!deletionReason.trim()) {
			notify('Please select a deletion reason', { type: 'warning' });
			return;
		}

		// Debug: Log the entire record to see what data is available
		console.log('Full record object:', record);
		console.log('Available fields:', Object.keys(record));

		setLoading(true);
		setOpenDialog(false);

		try {
			// Use email from record (already loaded from RPC function)
			const userEmail = record.email || null;

			// Step 1: Insert record into users_deleted table BEFORE deleting the user
			const deletionRecord = {
				user_id: record.id,
				email: userEmail || null,
				firstname: record.firstname || null,
				deletion_reason: deletionReason,
				deletion_details: deletionDetails.trim() || null,
				deleted_at: new Date().toISOString(),
			};

			console.log('Inserting into users_deleted:', deletionRecord);

			const { error: insertError } = await supabase
				.from('users_deleted')
				.insert(deletionRecord);

			if (insertError) {
				console.error('Error inserting into users_deleted:', insertError);
				notify(`Failed to log deletion: ${insertError.message}`, { type: 'error' });
				setLoading(false);
				return;
			}

			console.log('Successfully inserted into users_deleted');

			// Step 2: Get the current session to get the auth token
			const { data: { session } } = await supabase.auth.getSession();

			if (!session) {
				notify('You must be logged in to delete users', { type: 'error' });
				setLoading(false);
				return;
			}

			// Step 3: Get the Supabase URL from environment
			const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

			// Step 4: Call the edge function to delete the user
			const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${session.access_token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: record.id,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				console.error('Delete user error:', data);
				notify(data.error || 'Failed to delete user', { type: 'error' });
				setLoading(false);
				return;
			}

			notify('User deleted successfully', { type: 'success' });

			// Clear the form
			setDeletionReason('');
			setDeletionDetails('');

			// Redirect to the profiles list
			redirect('/profiles');
			refresh();
		} catch (error) {
			console.error('Unexpected error deleting user:', error);
			notify('An unexpected error occurred', { type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
	};

	const handleCloseWarningDialog = () => {
		setOpenWarningDialog(false);
	};

	return (
		<>
			<Button
				variant="contained"
				color="error"
				startIcon={(loading || fetchingStatus) ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
				onClick={handleDeleteClick}
				disabled={loading || fetchingStatus}
				sx={{ mt: 2 }}
			>
				{loading ? 'Deleting...' : fetchingStatus ? 'Checking status...' : 'Delete User'}
			</Button>

			{/* Warning Dialog - User Not Banned */}
			<Dialog
				open={openWarningDialog}
				onClose={handleCloseWarningDialog}
			>
				<DialogTitle>Cannot Delete User</DialogTitle>
				<DialogContent>
					<DialogContentText>
						You must ban this user before deleting their account. This is a safety precaution to prevent accidental deletions.
					</DialogContentText>
					<DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
						Current Status: {currentStatus?.charAt(0).toUpperCase() + (currentStatus?.slice(1) || '').replace('_', ' ')}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseWarningDialog} color="primary">
						OK
					</Button>
				</DialogActions>
			</Dialog>

			{/* Confirmation Dialog - User is Banned */}
			<Dialog
				open={openDialog}
				onClose={handleCloseDialog}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Confirm User Deletion</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to permanently delete this user account?
					</DialogContentText>
					<DialogContentText sx={{ mt: 2, color: 'error.main', fontWeight: 'bold' }}>
						⚠️ This action cannot be undone!
					</DialogContentText>
					<DialogContentText sx={{ mt: 2, mb: 2 }}>
						User: {record?.firstname} ({record?.email})
					</DialogContentText>

					{/* Deletion Reason - Required */}
					<FormControl fullWidth sx={{ mt: 3, mb: 2 }} required>
						<InputLabel id="deletion-reason-label">Deletion Reason *</InputLabel>
						<Select
							labelId="deletion-reason-label"
							id="deletion-reason"
							value={deletionReason}
							label="Deletion Reason *"
							onChange={(e) => setDeletionReason(e.target.value)}
						>
							<MenuItem value="spam">Spam Account</MenuItem>
							<MenuItem value="fake_profile">Fake Profile</MenuItem>
							<MenuItem value="harassment">Harassment</MenuItem>
							<MenuItem value="inappropriate_content">Inappropriate Content</MenuItem>
							<MenuItem value="user_request">User Requested Deletion</MenuItem>
							<MenuItem value="duplicate_account">Duplicate Account</MenuItem>
							<MenuItem value="terms_violation">Terms of Service Violation</MenuItem>
							<MenuItem value="other">Other</MenuItem>
						</Select>
					</FormControl>

					{/* Deletion Details - Optional */}
					<TextField
						fullWidth
						multiline
						rows={4}
						label="Additional Details (Optional)"
						placeholder="Add any additional information about this deletion..."
						value={deletionDetails}
						onChange={(e) => setDeletionDetails(e.target.value)}
						sx={{ mb: 2 }}
					/>

					<DialogContentText sx={{ mt: 1 }}>
						This will delete:
					</DialogContentText>
					<DialogContentText component="ul" sx={{ mt: 1, ml: 2 }}>
						<li>Profile information</li>
						<li>Photos and media</li>
						<li>Messages and conversations</li>
						<li>Matches and swipes</li>
						<li>All user data</li>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog} color="primary">
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
						disabled={!deletionReason.trim()}
					>
						Delete Permanently
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};
