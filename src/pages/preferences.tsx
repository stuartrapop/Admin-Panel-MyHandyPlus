import {
	Datagrid,
	DateField,
	FunctionField,
	List,
	ReferenceField,
	TextField
} from "react-admin";

import { ProfileReferenceField } from "../components/ProfileReferenceField";

interface TypesPreference {
	id: number;
	category: string;
	value: string;
	is_active: boolean;
	created_at: string;
}

export const PreferencesList = () => (
	<List>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>

			<ReferenceField source="preferred_gender_id" reference="types_preferences" label="Preferred Gender">
				<FunctionField render={(record: TypesPreference) => `${record.category}: ${record.value}`} />
			</ReferenceField>
			<ReferenceField source="relationship_type_id" reference="types_preferences" label="Relationship Type">
				<FunctionField render={(record: TypesPreference) => `${record.category}: ${record.value}`} />
			</ReferenceField>
			<TextField source="age_ranges" />
			<TextField source="min_age" />
			<TextField source="max_age" />
			<TextField source="distance_max_km" />
			<DateField source="created_at" />
		</Datagrid>
	</List>
);
