import React, { useEffect, useState } from 'react';
import { useRecordContext } from 'react-admin';
import { supabase } from '../supabaseClient';

interface ProfilePhotoFieldProps {
	label?: string;
	bucket?: string;
}

export const ProfilePhotoField: React.FC<ProfilePhotoFieldProps> = ({
	label,
	bucket = 'images'
}) => {
	const record = useRecordContext();
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchProfilePhoto = async () => {
			if (!record?.id) {
				setLoading(false);
				return;
			}

			try {
				// Find the profile photo (sort_order = 0) for this user
				const { data: photo, error: photoError } = await supabase
					.from('user_photos')
					.select('storage_key, sort_order, is_primary')
					.eq('user_id', record.id)
					.eq('sort_order', 0)  // Profile photo is sort_order = 0
					.single();

				if (photoError || !photo) {
					// If no sort_order=0 photo, try is_primary=true
					const { data: primaryPhoto, error: primaryError } = await supabase
						.from('user_photos')
						.select('storage_key, sort_order, is_primary')
						.eq('user_id', record.id)
						.eq('is_primary', true)
						.single();

					if (primaryError || !primaryPhoto) {
						// If no primary photo, get the most recent photo (any sort_order)
						const { data: recentPhoto, error: recentError } = await supabase
							.from('user_photos')
							.select('storage_key, sort_order, is_primary')
							.eq('user_id', record.id)
							.order('created_at', { ascending: false })
							.limit(1)
							.single();

						if (recentError || !recentPhoto) {
							// No photos found - this is normal, not an error
							setError('No photo');
							setLoading(false);
							return;
						}

						// Generate signed URL for the photo
						const { data: signedData, error: signedError } = await supabase.storage
							.from(bucket)
							.createSignedUrl(recentPhoto.storage_key, 3600);

						if (signedError) {
							console.error('ProfilePhotoField: Failed to generate signed URL:', signedError);
							setError('Failed to load');
						} else {
							setSignedUrl(signedData.signedUrl);
						}
					} else {
						// Generate signed URL for the primary photo
						const { data: signedData, error: signedError } = await supabase.storage
							.from(bucket)
							.createSignedUrl(primaryPhoto.storage_key, 3600);

						if (signedError) {
							console.error('ProfilePhotoField: Failed to generate signed URL:', signedError);
							setError('Failed to load');
						} else {
							setSignedUrl(signedData.signedUrl);
						}
					}
				} else {
					// Generate signed URL for the profile photo (sort_order = 0)
					const { data: signedData, error: signedError } = await supabase.storage
						.from(bucket)
						.createSignedUrl(photo.storage_key, 3600);

					if (signedError) {
						console.error('ProfilePhotoField: Failed to generate signed URL:', signedError);
						setError('Failed to load');
					} else {
						setSignedUrl(signedData.signedUrl);
					}
				}
			} catch (err) {
				console.error('ProfilePhotoField: Unexpected error loading photo:', err);
				setError('Failed to load');
			} finally {
				setLoading(false);
			}
		};

		fetchProfilePhoto();
	}, [record?.id, bucket]);

	if (loading) {
		return <div style={{
			width: '100%',
			height: '100%',
			minWidth: 60,
			minHeight: 60,
			backgroundColor: '#f0f0f0',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: '8px',
			border: '2px solid #ddd'
		}}>
			...
		</div>;
	}

	if (error || !signedUrl) {
		// Show a nice placeholder for users without photos
		const isNoPhoto = error === 'No photo';
		return <div style={{
			width: '100%',
			height: '100%',
			minWidth: 60,
			minHeight: 60,
			backgroundColor: isNoPhoto ? '#e3f2fd' : '#ffebee',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: isNoPhoto ? '#1976d2' : '#c62828',
			borderRadius: '8px',
			border: '2px solid #ddd',
			fontSize: isNoPhoto ? '48px' : '32px',
			fontWeight: 'bold'
		}} title={isNoPhoto ? 'No photo uploaded' : 'Failed to load photo'}>
			{isNoPhoto ? '👤' : '⚠️'}
		</div>;
	}

	return (
		<img
			src={signedUrl}
			alt={label || "Profile Photo"}
			style={{
				width: '100%',
				height: '100%',
				minWidth: 60,
				minHeight: 60,
				objectFit: 'cover',
				borderRadius: '8px',
				border: '2px solid #ddd'
			}}
			onError={(e) => {
				// Prevent repeated error attempts
				e.currentTarget.style.display = 'none';
				setError('Failed to load');
			}}
		/>
	);
};