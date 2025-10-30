import React, { useEffect, useState } from 'react';
import { useRecordContext } from 'react-admin';
import { supabase } from '../supabaseClient';

interface ProfilePhotoReferenceFieldProps {
	source: string;
	label?: string;
	bucket?: string;
}

export const ProfilePhotoReferenceField: React.FC<ProfilePhotoReferenceFieldProps> = ({
	source,
	label,
	bucket = 'images'
}) => {
	const record = useRecordContext();
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Get the profile ID from the source field (e.g., blocker_id or blocked_user_id)
	const profileId = record?.[source];

	useEffect(() => {
		const fetchProfilePhoto = async () => {
			if (!profileId) {
				setLoading(false);
				return;
			}

			try {
				// Find the profile photo (sort_order = 0) for this user
				const { data: photo, error: photoError } = await supabase
					.from('user_photos')
					.select('storage_key, sort_order, is_primary')
					.eq('user_id', profileId)
					.eq('sort_order', 0)  // Profile photo is sort_order = 0
					.single();

				if (photoError || !photo) {
					// If no sort_order=0 photo, try is_primary=true
					const { data: primaryPhoto, error: primaryError } = await supabase
						.from('user_photos')
						.select('storage_key, sort_order, is_primary')
						.eq('user_id', profileId)
						.eq('is_primary', true)
						.single();

					if (primaryError || !primaryPhoto) {
						// If no primary photo, get the most recent photo (any sort_order)
						const { data: recentPhoto, error: recentError } = await supabase
							.from('user_photos')
							.select('storage_key, sort_order, is_primary')
							.eq('user_id', profileId)
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
							console.error('ProfilePhotoReferenceField: Failed to generate signed URL:', signedError);
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
							console.error('ProfilePhotoReferenceField: Failed to generate signed URL:', signedError);
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
						console.error('ProfilePhotoReferenceField: Failed to generate signed URL:', signedError);
						setError('Failed to load');
					} else {
						setSignedUrl(signedData.signedUrl);
					}
				}
			} catch (err) {
				console.error('ProfilePhotoReferenceField: Unexpected error loading photo:', err);
				setError('Failed to load');
			} finally {
				setLoading(false);
			}
		};

		fetchProfilePhoto();
	}, [profileId, bucket]);

	if (loading) {
		return (
			<div
				style={{
					width: '75px',
					height: '75px',
					borderRadius: '50%',
					backgroundColor: '#f0f0f0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<span style={{ fontSize: '12px', color: '#999' }}>...</span>
			</div>
		);
	}

	if (error || !signedUrl) {
		return (
			<div
				style={{
					width: '75px',
					height: '75px',
					borderRadius: '50%',
					backgroundColor: '#e0e0e0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<span style={{ fontSize: '12px', color: '#666' }}>N/A</span>
			</div>
		);
	}

	return (
		<img
			src={signedUrl}
			alt={label || 'Profile Photo'}
			style={{
				width: '75px',
				height: '75px',
				borderRadius: '50%',
				objectFit: 'cover',
			}}
		/>
	);
};
