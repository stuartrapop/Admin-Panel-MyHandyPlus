import {
	BooleanField,
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const UserPresenceList = () => (
	<List>
		<Datagrid>
			<ProfileReferenceField
				source="id"
				label="User"
			/>

			<BooleanField source="is_online" />
			<DateField source="last_seen" />
			<DateField source="last_activity" />
			<TextField source="app_state" />
			<DateField source="created_at" />
			<DateField source="updated_at" />
		</Datagrid>
	</List>
);