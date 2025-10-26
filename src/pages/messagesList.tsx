import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";

import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const MessagesList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<TextField source="room_id" />

			<ProfileReferenceField
				source="sender_id"
				label="Sender"
			/>
			<ProfileReferenceField
				source="receiver_id"
				label="Receiver"
			/>

			<TextField source="content" />
			<DateField source="sent_at" />
			<DateField source="read_at" />
		</Datagrid>
	</List>
);
