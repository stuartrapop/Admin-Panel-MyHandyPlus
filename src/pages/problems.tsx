import { MenuItem, Select } from "@mui/material";
import {
	Datagrid,
	DateField,
	List,
	SelectInput,
	TextField,
	useRecordContext,
	useUpdate,
} from "react-admin";
import { CustomPagination } from "../components/CustomPagination";
import { ProfileReferenceField } from "../components/ProfileReferenceField";

const STATUS_CHOICES = ["open", "in_progress", "resolved", "closed"];
const MANAGER_CHOICES = ["Alexia", "Stuart"];

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

const TicketManagerDropdown = () => {
	const record = useRecordContext();
	const [update] = useUpdate();

	if (!record) return null;

	const handleChange = (e: { target: { value: string }; stopPropagation: () => void }) => {
		e.stopPropagation();
		update("problems", { id: record.id, data: { ticket_manager: e.target.value || null }, previousData: record });
	};

	return (
		<Select
			value={record.ticket_manager ?? ""}
			onChange={handleChange}
			onClick={(e) => e.stopPropagation()}
			size="small"
			variant="standard"
			disableUnderline
			displayEmpty
			sx={{ fontSize: '0.875rem' }}
		>
			<MenuItem value=""><em>None</em></MenuItem>
			{MANAGER_CHOICES.map((m) => (
				<MenuItem key={m} value={m}>{m}</MenuItem>
			))}
		</Select>
	);
};

export const ProblemsList = () => (
	<List
		sort={{ field: 'updated_at', order: 'DESC' }}
		perPage={25}
		pagination={<CustomPagination />}
		filters={[
			<SelectInput
				key="status"
				source="status"
				label="Status"
				choices={STATUS_CHOICES.map(s => ({ id: s, name: s }))}
				alwaysOn
				emptyText="All"
			/>
		]}
	>
		<Datagrid>
			<TextField source="id" />
			<ProfileReferenceField
				source="user_id"
				label="User"
			/>
			<TextField source="subject" />
			<TextField source="description" label="Description" sx={{ display: 'block', maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }} />
			<StatusDropdown label="Status" />
			<TextField source="priority" />
			<TicketManagerDropdown label="Manager" />
			<DateField source="created_at" label="Created At" showTime />
			<DateField source="updated_at" label="Updated At" showTime />
		</Datagrid>
	</List>
);