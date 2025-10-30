import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";
import { useNotify, useRecordContext, useRefresh } from "react-admin";
import { supabase } from "../supabaseClient";

export const GenderDropdown = () => {
	const record = useRecordContext();
	const notify = useNotify();
	const refresh = useRefresh();
	const [loading, setLoading] = useState(false);
	const [currentGender, setCurrentGender] = useState<string>('');
	const [genderAttributes, setGenderAttributes] = useState<{ id: number; value: string; }[]>([]);

	useEffect(() => {
		// Fetch gender attribute types
		const fetchGenderAttributes = async () => {
			const { data, error } = await supabase
				.from('types_attributes')
				.select('id, value')
				.eq('category', 'gender')
				.eq('is_active', true);

			if (error) {
				console.error('Error fetching gender attributes:', error);
			} else {
				setGenderAttributes(data || []);
			}
		};

		fetchGenderAttributes();
	}, []);

	useEffect(() => {
		// Fetch current gender for the user
		const fetchCurrentGender = async () => {
			if (!record?.id) return;

			const { data, error } = await supabase
				.from('profile_attributes')
				.select('attribute_id, types_attributes(value)')
				.eq('profile_id', record.id)
				.in('attribute_id', [0, 1, 2]) // gender attribute IDs
				.single();

			if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
				console.error('Error fetching current gender:', error);
			} else if (data) {
				const genderData = data.types_attributes as unknown as { value: string; };
				const genderValue = genderData?.value;
				setCurrentGender(genderValue || '');
			}
		};

		fetchCurrentGender();
	}, [record?.id]);

	const handleGenderChange = async (newGenderValue: string) => {
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

			// Find the attribute_id for the selected gender
			const selectedGender = genderAttributes.find(g => g.value === newGenderValue);
			if (!selectedGender) {
				notify('Invalid gender selection', { type: 'error' });
				setLoading(false);
				return;
			}

			// First, delete any existing gender attribute for this user
			await supabase
				.from('profile_attributes')
				.delete()
				.eq('profile_id', record.id)
				.in('attribute_id', [0, 1, 2]); // Remove all gender attributes

			// Insert the new gender attribute
			const { error } = await supabase
				.from('profile_attributes')
				.insert({
					profile_id: record.id,
					attribute_id: selectedGender.id,
				});

			if (error) {
				console.error('Error updating gender:', error);
				notify(`Error updating gender: ${error.message}`, { type: 'error' });
			} else {
				setCurrentGender(newGenderValue);
				notify('Gender updated successfully', { type: 'success' });
				// Refresh the page to update all displays
				refresh();
			}
		} catch (error) {
			console.error('Unexpected error:', error);
			notify('An unexpected error occurred', { type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const formatGenderLabel = (value: string) => {
		return value
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	return (
		<Box sx={{ minWidth: 200, display: 'flex', alignItems: 'center', gap: 1 }}>
			<FormControl fullWidth size="small" disabled={loading}>
				<InputLabel id="gender-select-label">Gender</InputLabel>
				<Select
					labelId="gender-select-label"
					id="gender-select"
					value={currentGender}
					label="Gender"
					onChange={(e) => handleGenderChange(e.target.value)}
				>
					{genderAttributes.map((gender) => (
						<MenuItem key={gender.id} value={gender.value}>
							{formatGenderLabel(gender.value)}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			{loading && <CircularProgress size={20} />}
		</Box>
	);
};
