import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";
import { ProfileReferenceField } from "../components/ProfileReferenceField";




export const StaffRolesList = () => (
	<List>
		<Datagrid>
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>
			<TextField source="role" />
			<DateField source="assigned_at" />
		</Datagrid>
	</List>
);