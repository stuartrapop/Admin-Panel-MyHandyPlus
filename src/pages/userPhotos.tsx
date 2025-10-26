import {
	BooleanField,
	Datagrid,
	DateField,
	List,
	NumberField,
	TextField
} from "react-admin";
import { PhotoField } from "../components/PhotoField";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const UserPhotoList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>
			<TextField source="kind" />
			<TextField source="status" />
			<PhotoField source="storage_key" label="Photo" bucket="images" />

			<TextField source="storage_key" label="Storage Key" />
			<NumberField source="sort_order" />
			<BooleanField source="is_primary" />
			<DateField source="created_at" />
		</Datagrid>
	</List>
);
