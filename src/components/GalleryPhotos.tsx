import { Box, Card, CardMedia, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useRecordContext } from "react-admin";
import { supabase } from "../supabaseClient";

interface PhotoData {
	number: number;
	url: string;
}

export const GalleryPhotos = () => {
	const record = useRecordContext();
	const userId = record?.id;
	const [photos, setPhotos] = useState<PhotoData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchGalleryPhotos = async () => {
			if (!userId) {
				setLoading(false);
				return;
			}

			try {
				// Gallery photos are stored as users/{userId}/gallery/0.webp through 4.webp
				const galleryNumbers = [0, 1, 2, 3, 4];
				const availablePhotos: PhotoData[] = [];

				for (const num of galleryNumbers) {
					try {
						const storagePath = `users/${userId}/gallery/${num}.webp`;
						console.log(`Trying to create signed URL for gallery photo ${num}: ${storagePath}`);

						const { data, error } = await supabase.storage
							.from('images')
							.createSignedUrl(storagePath, 3600);

						if (!error && data?.signedUrl) {
							availablePhotos.push({
								number: num,
								url: data.signedUrl
							});
							console.log(`✅ Gallery photo ${num} signed URL created`);
						} else {
							console.log(`Gallery photo ${num} not found or error:`, error?.message);
						}
					} catch (error) {
						console.error(`Error creating signed URL for gallery photo ${num}:`, error);
					}
				}

				console.log('Final available gallery photos:', availablePhotos);
				setPhotos(availablePhotos);
			} catch (error) {
				console.error('Unexpected error fetching gallery photos:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchGalleryPhotos();
	}, [userId]);

	if (!userId) return null;

	if (loading) {
		return (
			<Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (photos.length === 0) {
		return (
			<Box sx={{ mt: 3 }}>
				<Typography variant="h6" gutterBottom>
					Gallery Photos
				</Typography>
				<Typography variant="body2" color="text.secondary">
					No gallery photos found
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ mt: 3 }}>
			<Typography variant="h6" gutterBottom>
				Gallery Photos ({photos.length})
			</Typography>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
					gap: 2,
					mt: 2,
				}}
			>
				{photos.map((photo) => (
					<Card key={photo.number} sx={{ position: 'relative' }}>
						<CardMedia
							component="img"
							image={photo.url}
							alt={`Photo ${photo.number}`}
							sx={{
								width: '100%',
								height: 300,
								objectFit: 'cover',
							}}
						/>
						<Typography
							variant="caption"
							sx={{
								position: 'absolute',
								bottom: 8,
								right: 8,
								bgcolor: 'rgba(0, 0, 0, 0.6)',
								color: 'white',
								px: 1,
								py: 0.5,
								borderRadius: 1,
							}}
						>
							Photo {photo.number}
						</Typography>
					</Card>
				))}
			</Box>
		</Box>
	);
};
