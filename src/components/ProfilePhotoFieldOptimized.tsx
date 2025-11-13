import React, { useEffect, useRef, useState } from 'react';
import { useRecordContext } from 'react-admin';
import { supabase } from '../supabaseClient';

interface ProfilePhotoFieldProps {
	label?: string;
	bucket?: string;
	size?: 'small' | 'medium' | 'large'; // small for lists, medium/large for detail pages
}

// Cache for signed URLs to avoid regenerating them
const urlCache = new Map<string, { url: string; expires: number; }>();

export const ProfilePhotoField: React.FC<ProfilePhotoFieldProps> = ({
	label,
	bucket = 'images',
	size = 'small' // default to small for list views
}) => {
	const record = useRecordContext();
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const imgRef = useRef<HTMLDivElement>(null);

	// Get dimensions based on size prop
	const dimensions = size === 'small' ? 50 : size === 'medium' ? 150 : 300;

	// Intersection Observer for lazy loading
	useEffect(() => {
		if (!imgRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
						observer.disconnect();
					}
				});
			},
			{
				rootMargin: '50px', // Start loading 50px before the image is visible
			}
		);

		observer.observe(imgRef.current);

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		// Only fetch when visible
		if (!isVisible) return;
		if (!record?.profile_photo_url && !record?.id) return;

		const fetchProfilePhoto = async () => {
			setLoading(true);

			try {
				// If we have a signed URL from the database query, use it directly
				if (record.profile_photo_url) {
					setSignedUrl(record.profile_photo_url);
					setLoading(false);
					return;
				}

				// Fallback: if no storage_key in record, fetch from database (old behavior)
				if (!record?.id) {
					setLoading(false);
					return;
				}

				// Find the profile photo (sort_order = 0) for this user
				const { data: photo, error: photoError } = await supabase
					.from('user_photos')
					.select('storage_key')
					.eq('user_id', record.id)
					.eq('sort_order', 0)
					.single();

				if (photoError || !photo) {
					setError('No photo');
					setLoading(false);
					return;
				}

				// Check cache
				const cached = urlCache.get(photo.storage_key);
				const now = Date.now();

				if (cached && cached.expires > now) {
					setSignedUrl(cached.url);
					setLoading(false);
					return;
				}

				// Generate signed URL without transformations to avoid Supabase limits
				const { data: signedData, error: signedError } = await supabase.storage
					.from(bucket)
					.createSignedUrl(photo.storage_key, 3600);

				if (signedError) {
					console.error('ProfilePhotoField: Failed to generate signed URL:', signedError);
					setError('Failed to load');
				} else if (signedData?.signedUrl) {
					// Cache the URL
					urlCache.set(photo.storage_key, {
						url: signedData.signedUrl,
						expires: now + 50 * 60 * 1000,
					});
					setSignedUrl(signedData.signedUrl);
				}
			} catch (err) {
				console.error('ProfilePhotoField: Unexpected error loading photo:', err);
				setError('Failed to load');
			} finally {
				setLoading(false);
			}
		};

		fetchProfilePhoto();
	}, [isVisible, record, bucket, size]);

	// Placeholder while not visible or loading
	if (!isVisible || loading) {
		return (
			<div
				ref={imgRef}
				style={{
					width: `${dimensions}px`,
					height: `${dimensions}px`,
					borderRadius: '50%',
					backgroundColor: '#f0f0f0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<span style={{ fontSize: '12px', color: '#999' }}>
					{loading ? '...' : ''}
				</span>
			</div>
		);
	}

	if (error || !signedUrl) {
		return (
			<div
				style={{
					width: `${dimensions}px`,
					height: `${dimensions}px`,
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
				width: `${dimensions}px`,
				height: `${dimensions}px`,
				borderRadius: '50%',
				objectFit: 'cover',
			}}
			loading="lazy"
		/>
	);
};
