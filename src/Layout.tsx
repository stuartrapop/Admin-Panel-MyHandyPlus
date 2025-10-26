import type { ReactNode } from "react";
import { CheckForApplicationUpdate, Layout as RALayout } from "react-admin";
import { CustomMenu } from "./components/CustomMenu";

export const Layout = ({ children }: { children: ReactNode; }) => (
	<RALayout menu={CustomMenu}>
		{children}
		<CheckForApplicationUpdate />
	</RALayout>
);
