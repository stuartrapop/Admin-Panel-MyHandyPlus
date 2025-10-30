import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";
import { CustomPagination } from "../components/CustomPagination";

export const UsersDeletedList = () => (
	<List
		sort={{ field: 'deleted_at', order: 'DESC' }}
		perPage={25}
		pagination={<CustomPagination />}
	>
		<Datagrid bulkActionButtons={false}>

			<TextField source="id" label="User ID" />
			<TextField source="user_id" label="User ID" />
			<TextField source="firstname" label="Name" />
			<TextField source="email" label="Email" />
			<TextField source="deletion_reason" label="Reason" />
			<TextField source="deletion_details" label="Deleted By" />
			<DateField source="deleted_at" label="Deleted At" showTime />
			<DateField source="created_at" label="Originally Created" showTime />
		</Datagrid>
	</List>
);
