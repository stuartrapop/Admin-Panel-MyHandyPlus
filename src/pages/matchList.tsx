import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const MatchList = () => (
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
			<DateField source="matched_at" />
		</Datagrid>
	</List>
);
