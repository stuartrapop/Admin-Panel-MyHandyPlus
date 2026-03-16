import {
	Box,
	Card,
	CardContent,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Title } from 'react-admin';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { supabase } from '../supabaseClient';

interface AgeGroup {
	range: string;
	count: number;
}

interface CityCount {
	city: string;
	count: number;
}

interface RetentionPoint {
	month: string;
	retention: number;
	created: number;
	deleted: number;
}


function getDayKey(dateStr: string): string {
	const d = new Date(dateStr);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(key: string): string {
	const [year, month, day] = key.split('-');
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
}

export const UserAnalysisPage = () => {
	const [ageData, setAgeData] = useState<AgeGroup[]>([]);
	const [cityData, setCityData] = useState<CityCount[]>([]);
	const [retentionData, setRetentionData] = useState<RetentionPoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				console.log('1. Calling get_age_distribution...');
				const { data: ageBuckets, error: birthError } = await supabase.rpc('get_age_distribution');
				if (birthError) { console.error('get_age_distribution failed:', JSON.stringify(birthError)); throw new Error(birthError.message); }
				console.log('1. OK', ageBuckets);

				console.log('2. Calling get_top_cities_clustered...');
				const { data: cities, error: cityError } = await supabase.rpc('get_top_cities_clustered');
				if (cityError) { console.error('get_top_cities_clustered failed:', JSON.stringify(cityError)); throw new Error(cityError.message); }
				console.log('2. OK', cities);

				console.log('3. Fetching created profiles...');
				const { data: created, error: createdError } = await supabase
					.from('profiles').select('created_at').gte('created_at', '2026-02-01').limit(10000);
				if (createdError) { console.error('profiles created_at query failed:', JSON.stringify(createdError)); throw new Error(createdError.message); }
				console.log('3. OK', created?.length);

				console.log('4. Fetching deleted users...');
				const { data: deleted, error: deletedError } = await supabase
					.from('users_deleted').select('deleted_at').gte('deleted_at', '2026-02-01').limit(10000);
				if (deletedError) { console.error('users_deleted query failed:', JSON.stringify(deletedError)); throw new Error(deletedError.message); }
				console.log('4. OK', deleted?.length);

				// Age histogram — data comes pre-bucketed from SQL
				setAgeData(
					(ageBuckets || []).map((row: { age_range: string; user_count: number }) => ({
						range: row.age_range,
						count: row.user_count,
					}))
				);

				// Top 10 cities from RPC (already clustered by 25km radius)
				setCityData(
					(cities || []).map((row: { city_name: string; user_count: number }) => ({
						city: row.city_name,
						count: row.user_count,
					}))
				);

				// Retained users by month
				const createdByDay: Record<string, number> = {};
				(created || []).forEach(({ created_at }) => {
					const key = getDayKey(created_at);
					createdByDay[key] = (createdByDay[key] || 0) + 1;
				});

				const deletedByDay: Record<string, number> = {};
				(deleted || []).forEach(({ deleted_at }) => {
					if (deleted_at) {
						const key = getDayKey(deleted_at);
						deletedByDay[key] = (deletedByDay[key] || 0) + 1;
					}
				});

				const allDays = [
					...new Set([...Object.keys(createdByDay), ...Object.keys(deletedByDay)]),
				].sort();

				setRetentionData(
					allDays.map(day => {
						const c = createdByDay[day] || 0;
						const d = deletedByDay[day] || 0;
						const total = c + d;
						return {
							month: formatDayLabel(day),
							retention: total > 0 ? Math.round((c / total) * 100) : 100,
							created: c,
							deleted: d,
						};
					})
				);
			} catch (err) {
				console.error('Error fetching analysis data:', err);
				const msg = (err as { message?: string })?.message || JSON.stringify(err);
				setError(msg);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) return (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
			<CircularProgress />
		</Box>
	);

	if (error) return (
		<Box p={3}>
			<Title title="User Analysis" />
			<Typography color="error">Error: {error}</Typography>
		</Box>
	);

	return (
		<Box p={3}>
			<Title title="User Analysis" />
			<Typography variant="h4" gutterBottom>User Analysis</Typography>

			{/* Age Histogram */}
			<Box sx={{ mb: 4 }}>
				<Card>
					<CardContent>
						<Typography variant="h6" gutterBottom>Age Distribution</Typography>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={ageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="range" />
								<YAxis allowDecimals={false} />
								<Tooltip />
								<Bar dataKey="count" fill="#1976d2" name="Users" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</Box>

			{/* Top 20 Cities + Retained Users side by side */}
			<Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
				{/* Top 20 Cities */}
				<Card sx={{ flex: 1 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>Top 10 Cities (25 km clusters)</Typography>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
									<TableCell sx={{ fontWeight: 'bold' }}>City</TableCell>
									<TableCell align="right" sx={{ fontWeight: 'bold' }}>Users</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{cityData.map((row, i) => (
									<TableRow key={row.city} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
										<TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
										<TableCell>{row.city}</TableCell>
										<TableCell align="right">{row.count}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Retained Users */}
				<Card sx={{ flex: 2 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>Retained Users</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							New accounts created ÷ (created + deleted) per month, since February
						</Typography>
						<ResponsiveContainer width="100%" height={350}>
							<LineChart data={retentionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
								<Tooltip
									formatter={(value, name) => {
										if (name === 'retention') return [`${value}%`, 'Retention'];
										return [value, name];
									}}
								/>
								<Line
									type="monotone"
									dataKey="retention"
									stroke="#2e7d32"
									strokeWidth={3}
									dot={{ r: 5 }}
									name="retention"
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</Box>
		</Box>
	);
};
