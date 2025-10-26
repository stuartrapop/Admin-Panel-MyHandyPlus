import {
	BooleanField,
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";

import { ProfileReferenceField } from "../components/ProfileReferenceField";



export const ProblemsList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>
			<TextField source="description" />
			<TextField source="status" />
			<TextField source="priority" />
			<BooleanField source="email_sent" />
			<DateField source="created_at" />
			<DateField source="updated_at" />
			<DateField source="resolved_at" />
		</Datagrid>
	</List>
);
