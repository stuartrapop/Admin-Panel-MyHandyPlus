import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import React from "react";
import {
	BooleanField,
	Datagrid,
	DateField,
	FunctionField,
	List,
	NumberField,
	ReferenceField,
	ReferenceManyField,
	SelectInput,
	Show,
	SimpleShowLayout,
	SingleFieldList,
	TabbedShowLayout,
	TextField,
	TextInput,
	useGetList,
	useRecordContext,
} from "react-admin";
import { CustomPagination } from "../components/CustomPagination";
import { DeleteUserButton } from "../components/DeleteUserButton";
import { EmailField } from "../components/EmailField";
import { GalleryPhotos } from "../components/GalleryPhotos";
import { GenderDropdown } from "../components/GenderDropdown";
import { GenderField } from "../components/GenderField";
import { ProfilePhotoField } from "../components/ProfilePhotoFieldOptimized";
import { StatusDropdown } from "../components/StatusDropdown";

const profileFilters = [
	<TextInput
		key="firstname"
		label="Search First Name"
		source="firstname"
		placeholder="Search by first name..."
		alwaysOn
	/>,
	<TextInput
		key="name"
		label="Search Full Name"
		source="name"
		placeholder="Search by full name..."
		alwaysOn
	/>,
	<TextInput
		key="email"
		label="Search Email"
		source="email"
		placeholder="Search by email..."
		alwaysOn
	/>,
	<SelectInput
		key="status"
		label="Account Status"
		source="status"
		choices={[
			{ id: 'active', name: 'Active' },
			{ id: 'paused', name: 'Paused' },
			{ id: 'banned', name: 'Banned' },
			{ id: 'inactive', name: 'Inactive' },
			{ id: 'tester', name: 'Tester' },
			{ id: 'incomplete', name: 'Incomplete' },
			{ id: 'under_review_active', name: 'Under Review (Active)' },
			{ id: 'under_review_banned', name: 'Under Review (Banned)' },
		]}
		alwaysOn
	/>,
	<SelectInput
		key="gender"
		label="Gender"
		source="gender"
		choices={[
			{ id: 'male', name: 'Male' },
			{ id: 'female', name: 'Female' },
			{ id: 'non_binary', name: 'Non-binary' },
		]}
		alwaysOn
	/>
];

export const ProfilesList = () => (
	<List
		perPage={25}
		filters={profileFilters}
		sort={{ field: 'created_at', order: 'DESC' }}
		pagination={<CustomPagination />}
	>
		<Datagrid rowClick="show">

			<ProfilePhotoField label="Photo" size="small" />
			<TextField source="firstname" label="First Name" />
			<TextField source="name" label="Full Name" />
			<TextField source="gender_value" label="Gender" />
			<EmailField label="Email" />

			{/* Account Status - comes directly from RPC function as 'account_status' */}
			<FunctionField
				label="Status"
				source="account_status"
				sortable={true}
				render={(record: { account_status?: string; }) => {
					if (!record?.account_status || record.account_status === 'unknown') {
						return <Chip label="Unknown" size="small" color="default" />;
					}

					const statusColors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
						active: "success",
						paused: "warning",
						banned: "error",
						inactive: "default",
						tester: "info",
						incomplete: "warning",
						under_review: "info",
					};

					return (
						<Chip
							label={record.account_status.charAt(0).toUpperCase() + record.account_status.slice(1).replace('_', ' ')}
							size="small"
							color={statusColors[record.account_status] || "default"}
						/>
					);
				}}
			/>
			<DateField source="created_at" label="Joined" showTime />
			<TextField source="id" label="ID" />
		</Datagrid>
	</List>
);

// Custom component to display chat rooms for a user
interface ChatRoomRecord {
	id: number;
	user1_id: string;
	user2_id: string;
	last_message_at: string | null;
}

interface MessageRecord {
	id: number;
	room_id: number;
	sender_id: string;
	content: string;
	sent_at: string;
	read_at: string | null;
}

const UserChatRooms = () => {
	const record = useRecordContext();
	const userId = record?.id;
	const [expandedRoomId, setExpandedRoomId] = React.useState<number | null>(null);

	const { data: chatRooms, isLoading } = useGetList('chat_rooms', {
		filter: {},
		pagination: { page: 1, perPage: 100 },
		sort: { field: 'last_message_at', order: 'DESC' },
	});

	// Get last message for each room
	const { data: allMessages } = useGetList('messages', {
		filter: {},
		pagination: { page: 1, perPage: 1000 },
		sort: { field: 'sent_at', order: 'DESC' },
	});

	if (isLoading) return <Typography>Loading chat rooms...</Typography>;
	if (!userId) return null;

	// Filter rooms where this user is either user1 or user2
	const userRooms = chatRooms?.filter(
		(room: ChatRoomRecord) => room.user1_id === userId || room.user2_id === userId
	) || [];

	if (userRooms.length === 0) {
		return <Typography>No chat rooms found</Typography>;
	}

	const toggleRoom = (roomId: number) => {
		setExpandedRoomId(expandedRoomId === roomId ? null : roomId);
	};

	// Get last message for a room
	const getLastMessage = (roomId: number) => {
		return allMessages?.find((msg: MessageRecord) => msg.room_id === roomId);
	};

	return (
		<Box>
			{userRooms.map((room: ChatRoomRecord) => {
				const isExpanded = expandedRoomId === room.id;
				const lastMessage = getLastMessage(room.id);

				return (
					<Card
						key={room.id}
						sx={{
							mb: 1,
							cursor: 'pointer',
							'&:hover': { bgcolor: 'action.hover' },
							transition: 'background-color 0.2s'
						}}
						onClick={() => toggleRoom(room.id)}
					>
						<CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
							{/* Compact one-line summary */}
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 100 }}>
									Chat Room #{room.id}
								</Typography>

								<ReferenceField
									record={room}
									source={room.user1_id === userId ? 'user2_id' : 'user1_id'}
									reference="profiles"
									link={false}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<ProfilePhotoField label="" />
										<TextField source="firstname" sx={{ fontWeight: 500 }} />
									</Box>
								</ReferenceField>

								{lastMessage && (
									<>
										<Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
											<ReferenceField
												record={lastMessage}
												source="sender_id"
												reference="profiles"
												link={false}
											>
												<TextField source="firstname" />
											</ReferenceField>
										</Typography>

										<Typography
											variant="body2"
											sx={{
												flex: 1,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												color: 'text.secondary'
											}}
										>
											{lastMessage.content}
										</Typography>

										<Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 150 }}>
											{new Date(lastMessage.sent_at).toLocaleString()}
										</Typography>
									</>
								)}

								{!lastMessage && (
									<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
										No messages yet
									</Typography>
								)}
							</Box>

							{/* Expanded detailed view */}
							{isExpanded && (
								<Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
									<Typography variant="subtitle2" gutterBottom>
										Conversation History:
									</Typography>
									<ReferenceManyField
										record={room}
										reference="messages"
										target="room_id"
										sort={{ field: 'sent_at', order: 'DESC' }}
										perPage={10}
									>
										<Datagrid bulkActionButtons={false} sx={{ '& .RaDatagrid-rowCell': { py: 0.5 } }}>
											<ReferenceField source="sender_id" reference="profiles" link={false}>
												<TextField source="firstname" />
											</ReferenceField>
											<TextField source="content" label="Message" sx={{ maxWidth: 500 }} />
											<DateField source="sent_at" label="Sent" showTime />
											<DateField source="read_at" label="Read" showTime />
										</Datagrid>
									</ReferenceManyField>
								</Box>
							)}
						</CardContent>
					</Card>
				);
			})}
		</Box>
	);
};// Profile Show Page with all user details
export const ProfileShow = () => (
	<Show>
		<TabbedShowLayout>
			{/* Basic Information Tab */}
			<TabbedShowLayout.Tab label="Basic Info">
				<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
					<Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<Box sx={{ width: 300, height: 300, mb: 2 }}>
							<ProfilePhotoField label="" size="large" />
						</Box>
						<Typography variant="h6" gutterBottom>Profile Photo</Typography>
					</Box>
					<Box sx={{ flex: 1 }}>
						{/* Name and Action Controls Section */}
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 3 }}>
							{/* Left side - Name fields */}
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>User ID</Typography>
									<TextField source="id" label="" sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }} />
								</Box>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>First Name</Typography>
									<TextField source="firstname" label="" sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem', fontWeight: 500 } }} />
								</Box>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Full Name</Typography>
									<TextField source="name" label="" sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem', fontWeight: 500 } }} />
								</Box>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Email</Typography>
									<EmailField label="" />
								</Box>
							</Box>

							{/* Right side - Action controls */}
							<Box sx={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 2 }}>
								<StatusDropdown />
								<GenderDropdown />
								<DeleteUserButton />
							</Box>
						</Box>

						{/* Rest of the profile information */}
						<SimpleShowLayout>
							{/* Gender - get from profile_attributes */}
							<FunctionField
								label="Gender"
								render={(record: { id?: string; }) => {
									return (
										<GenderField userId={record?.id} />
									);
								}}
							/>

							<DateField source="birthdate" label="Birth Date" />
							<FunctionField
								label="Age"
								render={(record: { birthdate?: string; }) => {
									if (!record?.birthdate) return 'N/A';
									const age = Math.floor(
										(new Date().getTime() - new Date(record.birthdate).getTime()) /
										(365.25 * 24 * 60 * 60 * 1000)
									);
									return `${age} years`;
								}}
							/>
							<TextField source="profession" label="Profession" />
							<TextField source="bio" label="Bio" />
							<TextField source="declared_country" label="Country" />
							<TextField source="declared_city" label="City" />
							<BooleanField source="location_verified" label="Location Verified" />
							<DateField source="created_at" label="Account Created" showTime />
							<DateField source="updated_at" label="Last Updated" showTime />
						</SimpleShowLayout>
					</Box>
				</Box>

				{/* Gallery Photos at the bottom */}
				<GalleryPhotos />
			</TabbedShowLayout.Tab>

			{/* Attributes Tab */}
			<TabbedShowLayout.Tab label="Attributes" path="attributes">
				<Typography variant="h6" gutterBottom>Profile Attributes</Typography>
				<ReferenceManyField
					reference="profile_attributes"
					target="profile_id"
					label="User Attributes"
				>
					<SingleFieldList linkType={false}>
						<ReferenceField
							source="attribute_id"
							reference="types_attributes"
							link={false}
						>
							<FunctionField
								render={(record: { value?: string; category?: string; }) => {
									if (!record) return null;
									const formattedValue = record.value
										?.split('_')
										.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ');
									return (
										<Chip
											label={`${record.category}: ${formattedValue}`}
											size="small"
											sx={{ m: 0.5 }}
											color="primary"
											variant="outlined"
										/>
									);
								}}
							/>
						</ReferenceField>
					</SingleFieldList>
				</ReferenceManyField>
			</TabbedShowLayout.Tab>

			{/* Preferences Tab */}
			<TabbedShowLayout.Tab label="Preferences" path="preferences">
				<Typography variant="h6" gutterBottom>User Preferences</Typography>
				<ReferenceManyField
					reference="preferences"
					target="user_id"
					label=""
				>
					<Datagrid bulkActionButtons={false}>
						<ReferenceField
							source="preferred_gender_id"
							reference="types_preferences"
							label="Gender Preference"
							link={false}
						>
							<TextField source="value" />
						</ReferenceField>
						<NumberField source="min_age" label="Min Age" />
						<NumberField source="max_age" label="Max Age" />
						<NumberField source="distance_max_km" label="Max Distance (km)" />
						<ReferenceField
							source="relationship_type_id"
							reference="types_preferences"
							label="Looking For"
							link={false}
						>
							<TextField source="value" />
						</ReferenceField>
						<DateField source="created_at" label="Created" showTime />
					</Datagrid>
				</ReferenceManyField>
			</TabbedShowLayout.Tab>

			{/* Activity Tab */}
			<TabbedShowLayout.Tab label="Activity" path="activity">
				<Typography variant="h6" gutterBottom>Recent Activity</Typography>

				{/* Chat Rooms Section */}
				<Card sx={{ mb: 2 }}>
					<CardContent>
						<Typography variant="subtitle1" gutterBottom>Chat Rooms</Typography>
						<UserChatRooms />
					</CardContent>
				</Card>

				<Card sx={{ mb: 2 }}>
					<CardContent>
						<Typography variant="subtitle1" gutterBottom>Presence Status</Typography>
						<ReferenceField
							source="id"
							reference="user_presence"
							label=""
							link={false}
						>
							<SimpleShowLayout>
								<BooleanField source="is_online" label="Currently Online" />
								<DateField source="last_seen" label="Last Seen" showTime />
								<DateField source="last_activity" label="Last Activity" showTime />
								<TextField source="app_state" label="App State" />
								<TextField source="platform" label="Platform" />
								<BooleanField source="allow_presence_sharing" label="Sharing Presence" />
								<BooleanField source="show_to_matches_only" label="Matches Only" />
							</SimpleShowLayout>
						</ReferenceField>
					</CardContent>
				</Card>

				<Card sx={{ mb: 2 }}>
					<CardContent>
						<Typography variant="subtitle1" gutterBottom>Swipes Given</Typography>
						<ReferenceManyField
							reference="swipes"
							target="swiper_id"
							label=""
							sort={{ field: 'created_at', order: 'DESC' }}
						>
							<Datagrid bulkActionButtons={false}>
								<TextField source="swipee_id" label="User ID" />
								<BooleanField source="is_like" label="Liked" />
								<BooleanField source="seen_by_swipee" label="Seen" />
								<DateField source="created_at" label="Date" showTime />
							</Datagrid>
						</ReferenceManyField>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<Typography variant="subtitle1" gutterBottom>Matches</Typography>
						<ReferenceManyField
							reference="matches"
							target="user1_id"
							label=""
							sort={{ field: 'matched_at', order: 'DESC' }}
						>
							<Datagrid bulkActionButtons={false}>
								<TextField source="user2_id" label="Matched With" />
								<DateField source="matched_at" label="Matched At" showTime />
								<BooleanField source="seen_by_user1" label="Seen" />
							</Datagrid>
						</ReferenceManyField>
					</CardContent>
				</Card>
			</TabbedShowLayout.Tab>
		</TabbedShowLayout>
	</Show>
);