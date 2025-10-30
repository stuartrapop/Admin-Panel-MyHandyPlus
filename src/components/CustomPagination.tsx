import { Box, TextField } from '@mui/material';
import { useState } from 'react';
import { Pagination, useListContext } from 'react-admin';

export const CustomPagination = () => {
	const { setPage, total, perPage } = useListContext();
	const [jumpToPage, setJumpToPage] = useState('');
	const totalPages = Math.ceil((total || 0) / (perPage || 10));

	const handleJumpToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			const pageNumber = parseInt(jumpToPage);
			if (pageNumber >= 1 && pageNumber <= totalPages) {
				setPage(pageNumber);
				setJumpToPage('');
			}
		}
	};

	return (
		<Box display="flex" alignItems="center" gap={2}>
			<Pagination rowsPerPageOptions={[10, 25, 50]} />
			<Box display="flex" alignItems="center" gap={1}>
				<TextField
					size="small"
					label="Go to page"
					type="number"
					value={jumpToPage}
					onChange={(e) => setJumpToPage(e.target.value)}
					onKeyDown={handleJumpToPage}
					InputProps={{
						inputProps: {
							min: 1,
							max: totalPages,
							style: { width: '80px' }
						}
					}}
					helperText={`of ${totalPages}`}
				/>
			</Box>
		</Box>
	);
};
