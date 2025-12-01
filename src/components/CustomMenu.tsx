import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BlockIcon from '@mui/icons-material/Block';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeleteIcon from '@mui/icons-material/Delete';
import MapIcon from '@mui/icons-material/Map';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Report';
import SettingsIcon from '@mui/icons-material/Settings';
import { Menu } from 'react-admin';

export const CustomMenu = () => (
	<Menu>
		<Menu.DashboardItem leftIcon={<DashboardIcon />} />
		<Menu.Item to="/user-map" primaryText="User Map" leftIcon={<MapIcon />} />

		<Menu.ResourceItem name="profiles" leftIcon={<PeopleIcon />} />

		<Menu.ResourceItem name="user_blocks" leftIcon={<BlockIcon />} />
		<Menu.ResourceItem name="preferences" leftIcon={<SettingsIcon />} />
		<Menu.ResourceItem name="fcm_tokens" leftIcon={<NotificationsIcon />} />
		<Menu.ResourceItem name="problems" leftIcon={<ReportIcon />} />
		<Menu.ResourceItem name="staff_roles" leftIcon={<AdminPanelSettingsIcon />} />
		<Menu.ResourceItem name="users_deleted" leftIcon={<DeleteIcon />} />
		<Menu.ResourceItem name="problems" leftIcon={<DeleteIcon />} />
	</Menu>
);
