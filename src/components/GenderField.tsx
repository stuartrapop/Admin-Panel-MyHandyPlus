import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

interface GenderFieldProps {
	userId?: string;
}

export const GenderField = ({ userId }: GenderFieldProps) => {
	const [gender, setGender] = useState<string>('N/A');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchGender = async () => {
			if (!userId) {
				setLoading(false);
				return;
			}

			try {
				// Get profile attributes for this user where category is gender
				const { data: attributes, error: attrError } = await supabase
					.from('profile_attributes')
					.select('attribute_id')
					.eq('profile_id', userId);

				if (attrError || !attributes || attributes.length === 0) {
					setGender('N/A');
					setLoading(false);
					return;
				}

				// Get the attribute values
				const { data: attrTypes, error: typeError } = await supabase
					.from('types_attributes')
					.select('value, category')
					.eq('category', 'gender')
					.in('id', attributes.map(a => a.attribute_id));

				if (typeError || !attrTypes || attrTypes.length === 0) {
					setGender('N/A');
				} else {
					const genderValue = attrTypes[0].value
						.split('_')
						.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ');
					setGender(genderValue);
				}
			} catch (error) {
				console.error('Error fetching gender:', error);
				setGender('N/A');
			} finally {
				setLoading(false);
			}
		};

		fetchGender();
	}, [userId]);

	if (loading) {
		return <Typography variant="body2">Loading...</Typography>;
	}

	return <Typography variant="body2">{gender}</Typography>;
};
