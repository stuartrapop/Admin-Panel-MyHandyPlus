import { Block, Favorite, People, PersonSearch, TrendingUp, Wc } from '@mui/icons-material';
import { Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Title } from 'react-admin';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts';
import { supabase } from '../supabaseClient';

interface DashboardStats {
	total_users: number;
	male_users: number;
	female_users: number;
	non_binary_users: number;
	banned_users: number;
	active_users: number;
	tester_users: number;
	paused_users: number;
	incomplete_users: number;
	under_review_users: number;
	active_last_2_months: number;
	active_last_week: number;
	active_last_month: number;
	currently_online: number;
	avg_hours_since_last_seen: number;
	total_matches: number;
	total_messages: number;
	total_photos: number;
	users_with_avatar: number;
	like_rate_percentage: number;
	generated_at: string;
}

interface RelationshipStat {
	relationship_type: string;
	user_count: number;
	percentage: number;
}

interface MonthlyProfile {
	month: string;
	profiles_created: number;
	male_profiles: number;
	female_profiles: number;
	other_profiles: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({
	title,
	value,
	icon,
	color,
	subtitle
}: {
	title: string;
	value: number | string;
	icon: React.ReactNode;
	color: string;
	subtitle?: string;
}) => (
	<Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
		<CardContent>
			<Box display="flex" justifyContent="space-between" alignItems="flex-start">
				<Box>
					<Typography color="textSecondary" gutterBottom variant="body2">
						{title}
					</Typography>
					<Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
						{value.toLocaleString()}
					</Typography>
					{subtitle && (
						<Typography variant="caption" color="textSecondary">
							{subtitle}
						</Typography>
					)}
				</Box>
				<Box sx={{ color, opacity: 0.7 }}>
					{icon}
				</Box>
			</Box>
		</CardContent>
	</Card>
);

export const Dashboard = () => {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [relationshipStats, setRelationshipStats] = useState<RelationshipStat[]>([]);
	const [monthlyProfiles, setMonthlyProfiles] = useState<MonthlyProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				// Fetch overall stats from cached materialized view
				const { data: overviewData, error: overviewError } = await supabase
					.from('admin_dashboard_overview_cached')
					.select('*')
					.single();

				if (overviewError) throw overviewError;
				setStats(overviewData);

				// Fetch relationship stats
				const { data: relationshipData, error: relationshipError } = await supabase
					.from('admin_relationship_stats')
					.select('*');

				if (relationshipError) throw relationshipError;
				setRelationshipStats(relationshipData || []);

				// Fetch monthly profile creation
				const { data: monthlyData, error: monthlyError } = await supabase
					.from('admin_profiles_by_month')
					.select('*');

				if (monthlyError) throw monthlyError;

				// Format the monthly data for charts
				const formattedMonthlyData = (monthlyData || []).map(item => ({
					...item,
					month: new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
				})).reverse(); // Reverse to show oldest to newest

				setMonthlyProfiles(formattedMonthlyData);

			} catch (err) {
				console.error('Error fetching dashboard data:', err);
				setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={3}>
				<Title title="Dashboard" />
				<Typography color="error">Error: {error}</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
					Please make sure the Supabase views are created. Run the SQL in supabase-views.sql
				</Typography>
			</Box>
		);
	}

	if (!stats) {
		return (
			<Box p={3}>
				<Title title="Dashboard" />
				<Typography>No data available</Typography>
			</Box>
		);
	}

	// Prepare gender distribution data
	const genderData = [
		{ name: 'Male', value: stats.male_users, color: '#0088FE' },
		{ name: 'Female', value: stats.female_users, color: '#FF8042' },
		{ name: 'Non-Binary/Other', value: stats.non_binary_users, color: '#00C49F' },
	].filter(item => item.value > 0);

	return (
		<Box p={3}>
			<Title title="Dashboard" />
			<Typography variant="h4" gutterBottom>
				Admin Dashboard
			</Typography>
			<Typography variant="body1" color="textSecondary" paragraph>
				Overview of MyHandyPlus user statistics and trends
			</Typography>

			{/* Stats Cards */}
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Total Users"
						value={stats.total_users}
						icon={<People sx={{ fontSize: 40 }} />}
						color="#1976d2"
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Active Users"
						value={stats.active_users}
						icon={<PersonSearch sx={{ fontSize: 40 }} />}
						color="#2e7d32"
						subtitle="Not banned"
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Active (2 months)"
						value={stats.active_last_2_months}
						icon={<TrendingUp sx={{ fontSize: 40 }} />}
						color="#9c27b0"
						subtitle="Seen in last 60 days"
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Banned Users"
						value={stats.banned_users}
						icon={<Block sx={{ fontSize: 40 }} />}
						color="#d32f2f"
					/>
				</Box>
			</Stack>

			{/* Engagement Stats */}
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Total Matches"
						value={stats.total_matches}
						icon={<Favorite sx={{ fontSize: 40 }} />}
						color="#e91e63"
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Total Messages"
						value={stats.total_messages}
						icon={<Favorite sx={{ fontSize: 40 }} />}
						color="#9c27b0"
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Currently Online"
						value={stats.currently_online}
						icon={<PersonSearch sx={{ fontSize: 40 }} />}
						color="#00bcd4"
						subtitle="Online right now"
					/>
				</Box>
				<Box sx={{ flex: 1 }}>
					<StatCard
						title="Like Rate"
						value={`${stats.like_rate_percentage}%`}
						icon={<Favorite sx={{ fontSize: 40 }} />}
						color="#f50057"
					/>
				</Box>
			</Stack>

			{/* Gender and Relationship Stats */}
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
				{/* Gender Distribution */}
				<Box sx={{ flex: 1 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<Wc sx={{ verticalAlign: 'middle', mr: 1 }} />
								Gender Distribution
							</Typography>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={genderData}
										cx="50%"
										cy="50%"
										labelLine={false}
										label
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
									>
										{genderData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
							<Box display="flex" justifyContent="space-around" mt={2}>
								<Box textAlign="center">
									<Typography variant="h6" color="primary">{stats.male_users}</Typography>
									<Typography variant="caption" color="textSecondary">Male</Typography>
								</Box>
								<Box textAlign="center">
									<Typography variant="h6" color="secondary">{stats.female_users}</Typography>
									<Typography variant="caption" color="textSecondary">Female</Typography>
								</Box>
								<Box textAlign="center">
									<Typography variant="h6" sx={{ color: '#00C49F' }}>{stats.non_binary_users}</Typography>
									<Typography variant="caption" color="textSecondary">Other</Typography>
								</Box>
							</Box>
						</CardContent>
					</Card>
				</Box>

				{/* Relationship Types */}
				<Box sx={{ flex: 1 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<Favorite sx={{ verticalAlign: 'middle', mr: 1 }} />
								Relationship Types Sought
							</Typography>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={relationshipStats}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="relationship_type" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="user_count" fill="#8884d8">
										{relationshipStats.map((_entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</Box>
			</Stack>

			{/* Monthly Profile Creation */}
			<Box sx={{ mb: 4 }}>
				<Card>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							<TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
							Profile Creation Trends (Last 2 Years)
						</Typography>
						<ResponsiveContainer width="100%" height={400}>
							<LineChart data={monthlyProfiles}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis
									dataKey="month"
									angle={-45}
									textAnchor="end"
									height={80}
								/>
								<YAxis />
								<Tooltip />
								<Legend />
								<Line
									type="monotone"
									dataKey="profiles_created"
									stroke="#8884d8"
									strokeWidth={3}
									name="Total Profiles"
								/>
								<Line
									type="monotone"
									dataKey="male_profiles"
									stroke="#0088FE"
									strokeWidth={2}
									name="Male"
								/>
								<Line
									type="monotone"
									dataKey="female_profiles"
									stroke="#FF8042"
									strokeWidth={2}
									name="Female"
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</Box>
		</Box>
	);
};