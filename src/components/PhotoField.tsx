import React, { useEffect, useState } from 'react';
import { useRecordContext } from 'react-admin';
import { supabase } from '../supabaseClient';

interface PhotoFieldProps {
	source: string;
	label?: string;
	bucket?: string; // Supabase storage bucket name
}

export const PhotoField: React.FC<PhotoFieldProps> = ({
	source,
	label,
	bucket = 'images' // Default bucket name, adjust as needed
}) => {
	const record = useRecordContext();
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchSignedUrl = async () => {
			if (!record || !record[source]) {
				console.log('PhotoField: No record or storage_key', { record, source });
				setLoading(false);
				return;
			}

			console.log('PhotoField: Fetching signed URL for', record[source], 'in bucket', bucket);

			try {
				// First check if user has admin/moderator role
				const { data: { session } } = await supabase.auth.getSession();
				let hasAdminAccess = false;

				if (session) {
					const { data: staffRole } = await supabase
						.from('staff_roles')
						.select('role')
						.eq('user_id', session.user.id)
						.single();

					hasAdminAccess = staffRole?.role && ['admin', 'moderator'].includes(staffRole.role);
				}

				// Create signed URL using Supabase Storage
				// Expires in 1 hour (3600 seconds)
				const { data, error } = await supabase.storage
					.from(bucket)
					.createSignedUrl(record[source], 3600);

				if (error) {
					console.error('PhotoField: Error creating signed URL:', error);
					console.log('PhotoField: Has admin access:', hasAdminAccess);
					console.log('PhotoField: Storage key:', record[source]);
					setError('Failed to load image');
				} else if (data) {
					console.log('PhotoField: Signed URL created:', data.signedUrl);
					setSignedUrl(data.signedUrl);
				}
			} catch (err) {
				console.error('PhotoField: Exception:', err);
				setError('Failed to load image');
			} finally {
				setLoading(false);
			}
		};

		fetchSignedUrl();
	}, [record, source, bucket]);

	if (loading) {
		return <div style={{
			width: 100,
			height: 100,
			backgroundColor: '#f0f0f0',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 4,
			border: '1px solid #ddd'
		}}>
			Loading...
		</div>;
	}

	if (error || !signedUrl) {
		return <div style={{
			width: 100,
			height: 100,
			backgroundColor: '#ffebee',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: '#c62828',
			borderRadius: 4,
			border: '1px solid #ddd'
		}}>
			{error || 'No image'}
		</div>;
	}

	return (
		<img
			src={signedUrl}
			alt={label || "Photo"}
			style={{
				width: 100,
				height: 100,
				objectFit: 'cover',
				borderRadius: 4,
				border: '1px solid #ddd'
			}}
			onError={() => {
				console.error('PhotoField: Image failed to load:', signedUrl);
				setError('Failed to load');
			}}
		/>
	);
};