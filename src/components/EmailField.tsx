import React from 'react';
import { useRecordContext } from 'react-admin';

interface EmailFieldProps {
	source?: string;
	label?: string;
}

export const EmailField: React.FC<EmailFieldProps> = ({ source = 'email' }) => {
	const record = useRecordContext();

	// Simply display the email from the record (comes from RPC function)
	const email = record?.[source];

	if (!email) {
		return <span style={{ color: '#999' }}>No email</span>;
	}

	return <span>{email}</span>;
};