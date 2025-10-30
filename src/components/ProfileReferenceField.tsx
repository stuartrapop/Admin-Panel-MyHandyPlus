import React from "react";
import { FunctionField, ReferenceField } from "react-admin";

interface ProfileReferenceFieldProps {
	source: string;
	label?: string;
	showUuidChars?: number;
	emptyText?: string;
}

export const ProfileReferenceField: React.FC<ProfileReferenceFieldProps> = ({
	source,
	label,
	showUuidChars = 4,
	emptyText = "Unknown"
}) => (
	<ReferenceField source={source} reference="profiles" label={label}>
		<FunctionField render={(record) => {
			// Try different possible field names for display name
			const name = record.firstname ||
				record.username ||
				record.full_name ||
				record.name ||
				record.email;

			// Try different possible field names for UUID
			const uuid = record.id || record.uuid;

			// Format: "Display Name (uuid)"
			const displayName = name || emptyText;
			const uuidPart = uuid ? uuid.substring(0, showUuidChars) : "????";

			return `${displayName} (${uuidPart})`;
		}} />
	</ReferenceField>
);