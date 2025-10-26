import {
	BooleanField,
	Datagrid,
	DateField,
	List
} from "react-admin";
import { ProfileReferenceField } from "../components/ProfileReferenceField";




export const SwipesList = () => (
	<List>
		<Datagrid>
			<ProfileReferenceField
				source="swiper_id"
				label="Swiper"
			/>
			<ProfileReferenceField
				source="swipee_id"
				label="Swipee"
			/>
			<BooleanField source="is_like" />
			<DateField source="created_at" />
			<DateField source="updated_at" />
		</Datagrid>
	</List>
);