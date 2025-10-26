import { Chat as ChatIcon } from "@mui/icons-material";
import {
	Button,
	Datagrid,
	DateField,
	FunctionField,
	List,
	TextField,
	useRedirect
} from "react-admin";

import { ProfileReferenceField } from "../components/ProfileReferenceField";

interface ChatRoom {
	id: number;
	user1_id: string;
	user2_id: string;
	created_at: string;
	last_message_at: string;

}

const ViewMessagesButton = ({ record }: { record: ChatRoom; }) => {
	const redirect = useRedirect();

	const handleClick = () => {
		redirect(`/messages?filter=${encodeURIComponent(JSON.stringify({ room_id: record.id }))}`);
	};

	return (
		<Button
			onClick={handleClick}
			label="View Messages"
			startIcon={<ChatIcon />}
			variant="outlined"
			size="small"
		/>
	);
};

export const ChatRoomList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user1_id"
				label="User1"
			/>
			<ProfileReferenceField
				source="user2_id"
				label="User2"
			/>
			<DateField source="created_at" />
			<DateField source="last_message_at" />

			<FunctionField
				label="Actions"
				render={(record: ChatRoom) => <ViewMessagesButton record={record} />}
			/>
		</Datagrid>
	</List>
);
