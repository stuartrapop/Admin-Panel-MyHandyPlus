import React, { useEffect, useState } from 'react';
import { useRecordContext } from 'react-admin';
import { supabase } from '../supabaseClient';

interface DebugPhotoFieldProps {
	source: string;
	bucket?: string;
}

export const DebugPhotoField: React.FC<DebugPhotoFieldProps> = ({
	source,
	bucket = 'images'
}) => {
	const record = useRecordContext();
	const [debugInfo, setDebugInfo] = useState<string>('');

	useEffect(() => {
		const debugStorage = async () => {
			if (!record || !record[source]) {
				setDebugInfo('No storage_key found');
				return;
			}

			const storageKey = record[source];
			let info = `Storage Key: ${storageKey}\n`;

			try {
				// Check if file exists
				const { data: fileList, error: listError } = await supabase.storage
					.from(bucket)
					.list('', {
						limit: 100,
						search: storageKey.split('/').pop() // Get filename
					});

				if (listError) {
					info += `List Error: ${listError.message}\n`;
				} else {
					info += `Files in bucket: ${fileList?.length || 0}\n`;
					if (fileList && fileList.length > 0) {
						info += `First few files: ${fileList.slice(0, 3).map(f => f.name).join(', ')}\n`;
					}
				}

				// Try to get public URL
				const { data: publicUrl } = supabase.storage
					.from(bucket)
					.getPublicUrl(storageKey);

				info += `Public URL: ${publicUrl?.publicUrl || 'N/A'}\n`;

				// Try signed URL
				const { data: signedData, error: signedError } = await supabase.storage
					.from(bucket)
					.createSignedUrl(storageKey, 3600);

				if (signedError) {
					info += `Signed URL Error: ${signedError.message}\n`;
				} else {
					info += `Signed URL: ${signedData?.signedUrl ? 'Generated successfully' : 'Failed'}\n`;
				}

			} catch (err) {
				info += `Exception: ${err}\n`;
			}

			setDebugInfo(info);
		};

		debugStorage();
	}, [record, source, bucket]);

	return (
		<div style={{
			width: 300,
			height: 200,
			backgroundColor: '#f5f5f5',
			border: '1px solid #ddd',
			borderRadius: 4,
			padding: 8,
			fontSize: 12,
			fontFamily: 'monospace',
			overflow: 'auto'
		}}>
			<pre>{debugInfo || 'Loading debug info...'}</pre>
		</div>
	);
};