import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BlockIcon from '@mui/icons-material/Block';
import ChatIcon from '@mui/icons-material/Chat';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import PhotoIcon from '@mui/icons-material/Photo';
import ReportIcon from '@mui/icons-material/Report';
import SettingsIcon from '@mui/icons-material/Settings';
import SwipeIcon from '@mui/icons-material/SwipeRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Menu } from 'react-admin';

export const CustomMenu = () => (
	<Menu>
		<Menu.DashboardItem leftIcon={<DashboardIcon />} />
		<Menu.Item to="/user-map" primaryText="User Map" leftIcon={<MapIcon />} />
		<Menu.ResourceItem name="profiles" leftIcon={<PeopleIcon />} />
		<Menu.ResourceItem name="user_photos" leftIcon={<PhotoIcon />} />
		<Menu.ResourceItem name="chat_rooms" leftIcon={<ChatIcon />} />
		<Menu.ResourceItem name="matches" leftIcon={<FavoriteIcon />} />
		<Menu.ResourceItem name="messages" leftIcon={<MessageIcon />} />
		<Menu.ResourceItem name="swipes" leftIcon={<SwipeIcon />} />
		<Menu.ResourceItem name="user_locations" leftIcon={<LocationOnIcon />} />
		<Menu.ResourceItem name="user_presence" leftIcon={<VisibilityIcon />} />
		<Menu.ResourceItem name="user_blocks" leftIcon={<BlockIcon />} />
		<Menu.ResourceItem name="preferences" leftIcon={<SettingsIcon />} />
		<Menu.ResourceItem name="fcm_tokens" leftIcon={<NotificationsIcon />} />
		<Menu.ResourceItem name="problems" leftIcon={<ReportIcon />} />
		<Menu.ResourceItem name="staff_roles" leftIcon={<AdminPanelSettingsIcon />} />
	</Menu>
);
