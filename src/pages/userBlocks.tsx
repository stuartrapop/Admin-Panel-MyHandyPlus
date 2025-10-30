import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";
import { CustomPagination } from "../components/CustomPagination";
import { ProfilePhotoReferenceField } from "../components/ProfilePhotoReferenceField";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const UserBlocks = () => (
	<List
		sort={{ field: 'updated_at', order: 'DESC' }}
		perPage={25}
		pagination={<CustomPagination />}
	>
		<Datagrid>
			<TextField source="id" />
			<ProfilePhotoReferenceField
				source="blocker_id"
				label="Blocker Photo"
			/>
			<ProfileReferenceField
				source="blocker_id"
				label="Blocker"
			/>
			<ProfilePhotoReferenceField
				source="blocked_user_id"
				label="Blocked Photo"
			/>
			<ProfileReferenceField
				source="blocked_user_id"
				label="Blocked User"
			/>
			<TextField source="reason" />
			<TextField source="additional_info" />

			<DateField source="updated_at" label="Blocked At" showTime />
		</Datagrid>
	</List>
);