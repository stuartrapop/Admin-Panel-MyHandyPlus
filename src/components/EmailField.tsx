import React, { useEffect, useState } from 'react';
import { useRecordContext } from 'react-admin';
import { supabase } from '../supabaseClient';

interface EmailFieldProps {
	source?: string;
	label?: string;
}

export const EmailField: React.FC<EmailFieldProps> = () => {
	const record = useRecordContext();
	const [email, setEmail] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchEmail = async () => {
			if (!record?.id) {
				setLoading(false);
				return;
			}

			try {
				// Try RPC function first
				console.log('Trying RPC function for user:', record.id);
				console.log('Current authenticated user:', (await supabase.auth.getUser()).data.user?.id);

				const { data, error } = await supabase.rpc('get_user_email', {
					requested_user_id: record.id
				});

				if (error) {
					console.error('RPC Error:', error);
					console.log('Full error object:', JSON.stringify(error, null, 2));
					setEmail('RPC function not found - check Supabase');
				} else {
					console.log('Email fetched successfully:', data);
					setEmail(data || 'No email found');
				}
			} catch (err) {
				console.error('Exception fetching email:', err);
				setEmail('Error loading email');
			} finally {
				setLoading(false);
			}
		};

		fetchEmail();
	}, [record?.id]);

	if (loading) {
		return <span>Loading...</span>;
	}

	return <span>{email}</span>;
};