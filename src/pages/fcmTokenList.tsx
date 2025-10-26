import {
	Datagrid,
	DateField,
	List,
	TextField
} from "react-admin";

import { ProfileReferenceField } from "../components/ProfileReferenceField";

export const FcmTokenList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>
			<TextField source="token" />
			<TextField source="device_info.platform" />
			<DateField source="created_at" />
		</Datagrid>
	</List>
);
