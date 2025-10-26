import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { useNotify, useRecordContext, useRefresh } from "react-admin";
import { supabase } from "../supabaseClient";

export const StatusDropdown = () => {
	const record = useRecordContext();
	const notify = useNotify();
	const refresh = useRefresh();
	const [loading, setLoading] = useState(false);
	const [currentStatus, setCurrentStatus] = useState(record?.account_status || 'active');

	const handleStatusChange = async (newStatus: string) => {
		if (!record?.id) return;

		setLoading(true);
		try {
			// Get the currently logged-in admin user
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				notify('Unable to identify admin user', { type: 'error' });
				setLoading(false);
				return;
			}

			// Upsert status record into user_account_status table
			const { error } = await supabase
				.from('user_account_status')
				.upsert({
					user_id: record.id,
					status: newStatus,
					reason: `Status changed to ${newStatus} by admin`,
					changed_by: user.id, // ID of the logged-in admin
					changed_at: new Date().toISOString(),
				}, {
					onConflict: 'user_id'
				});

			if (error) {
				console.error('Error updating status:', error);
				notify(`Error updating status: ${error.message}`, { type: 'error' });
			} else {
				setCurrentStatus(newStatus);
				notify('Status updated successfully', { type: 'success' });
				// Refresh the page to update all status displays
				refresh();
			}
		} catch (error) {
			console.error('Unexpected error:', error);
			notify('An unexpected error occurred', { type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const statusColors = {
		active: '#2e7d32',
		paused: '#ed6c02',
		banned: '#d32f2f',
		inactive: '#757575',
		tester: '#0288d1',
	};

	return (
		<Box sx={{ minWidth: 200, display: 'flex', alignItems: 'center', gap: 1 }}>
			<FormControl fullWidth size="small" disabled={loading}>
				<InputLabel id="status-select-label">Account Status</InputLabel>
				<Select
					labelId="status-select-label"
					id="status-select"
					value={currentStatus}
					label="Account Status"
					onChange={(e) => handleStatusChange(e.target.value)}
					sx={{
						color: statusColors[currentStatus as keyof typeof statusColors] || '#000',
						fontWeight: 600,
					}}
				>
					<MenuItem value="active">Active</MenuItem>
					<MenuItem value="paused">Paused</MenuItem>
					<MenuItem value="banned">Banned</MenuItem>
					<MenuItem value="inactive">Inactive</MenuItem>
					<MenuItem value="tester">Tester</MenuItem>
				</Select>
			</FormControl>
			{loading && <CircularProgress size={20} />}
		</Box>
	);
};
