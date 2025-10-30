import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";
import { CustomPagination } from "../components/CustomPagination";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const ProblemsList = () => (
	<List
		sort={{ field: 'updated_at', order: 'DESC' }}
		perPage={25}
		pagination={<CustomPagination />}
	>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>
			<TextField source="subject" />
			<TextField source="description" />
			<TextField source="status" />
			<TextField source="priority" />

			<DateField source="created_at" label="Created At" showTime />
			<DateField source="updated_at" label="Updated At" showTime />
		</Datagrid>
	</List>
);