import { MenuItem, Select } from "@mui/material";
import {
	Datagrid,
	DateField,
	List,
	TextField,
	useRecordContext,
	useUpdate,
} from "react-admin";
import { CustomPagination } from "../components/CustomPagination";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

const STATUS_CHOICES = ["open", "in_progress", "resolved", "closed"];

const StatusDropdown = () => {
	const record = useRecordContext();
	const [update] = useUpdate();

	if (!record) return null;

	const handleChange = (e: { target: { value: string }; stopPropagation: () => void }) => {
		update("problems", { id: record.id, data: { status: e.target.value }, previousData: record });
	};

	return (
		<Select
			value={record.status ?? "open"}
			onChange={handleChange}
			onClick={(e) => e.stopPropagation()}
			size="small"
			variant="standard"
			disableUnderline
			sx={{ fontSize: '0.875rem' }}
		>
			{STATUS_CHOICES.map((s) => (
				<MenuItem key={s} value={s}>{s}</MenuItem>
			))}
		</Select>
	);
};

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
			<StatusDropdown label="Status" />
			<TextField source="priority" />

			<DateField source="created_at" label="Created At" showTime />
			<DateField source="updated_at" label="Updated At" showTime />
		</Datagrid>
	</List>
);