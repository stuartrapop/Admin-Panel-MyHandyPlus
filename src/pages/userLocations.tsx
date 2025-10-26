import { Clear as ClearIcon, FilterList as FilterIcon } from "@mui/icons-material";
import {
	Button,
	Datagrid,
	DateField,
	FunctionField,
	List,
	TextField,
	TopToolbar,
	useListContext,
	useRedirect
} from "react-admin";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

interface UserLocation {
	id: number;
	user_id: string;
	ip_address: string;
	country_code: string;
	country_name: string;
	region: string;
	city: string;
	created_at: string;
}

const FilterUserLocationsButton = ({ userId }: { userId: string; }) => {
	const redirect = useRedirect();

	const handleClick = () => {
		// Create a filter that shows all location entries for this user
		const filter = { user_id: userId };
		redirect(`/user_locations?filter=${encodeURIComponent(JSON.stringify(filter))}`);
	};

	return (
		<Button
			onClick={handleClick}
			label="Filter User Locations"
			startIcon={<FilterIcon />}
			variant="text"
			size="small"
			sx={{ ml: 1 }}
		/>
	);
};

const ClearFiltersButton = () => {
	const { setFilters } = useListContext();

	const handleClick = () => {
		setFilters({}, []);
	};

	return (
		<Button
			onClick={handleClick}
			label="Clear Filters"
			startIcon={<ClearIcon />}
			variant="outlined"
			size="small"
		/>
	);
};

const UserLocationsActions = () => (
	<TopToolbar>
		<ClearFiltersButton />
	</TopToolbar>
);

const UserField = ({ record }: { record: UserLocation; }) => (
	<div style={{ display: 'flex', alignItems: 'center' }}>
		<ProfileReferenceField source="user_id" />
		<FilterUserLocationsButton userId={record.user_id} />
	</div>
);

export const UserLocationsList = () => (
	<List actions={<UserLocationsActions />}>
		<Datagrid>
			<TextField source="id" />
			<FunctionField
				label="User"
				render={(record: UserLocation) => <UserField record={record} />}
			/>
			<TextField source="ip_address" />
			<TextField source="country_code" />
			<TextField source="country_name" />
			<TextField source="region" />
			<TextField source="city" />
			<DateField source="created_at" />
		</Datagrid>
	</List>
);