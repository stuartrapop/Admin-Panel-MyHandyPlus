import { Admin, CustomRoutes, ListGuesser, Resource } from "react-admin";
import { Route } from "react-router-dom";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { Layout } from "./Layout";
import { CustomLoginPage } from "./LoginPage";
import { ChatRoomList } from "./pages/chatRooms";
import { Dashboard } from "./pages/Dashboard";
import { FcmTokenList } from "./pages/fcmTokenList";
import { MatchList } from "./pages/matchList";
import { MessagesList } from "./pages/messagesList";
import { PreferencesList } from "./pages/preferences";
import { ProblemsList } from "./pages/problems";
import { ProfileShow, ProfilesList } from "./pages/profiles";
import { StaffRolesList } from "./pages/staffRoles";
import { SwipesList } from "./pages/swipes";
import { UserLocationsList } from "./pages/userLocations";
import UserMapPage from "./pages/UserMapPage";
import { UserPhotoList } from "./pages/userPhotos";
import { UserPresenceList } from "./pages/userPresence";

export const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    loginPage={CustomLoginPage}
    layout={Layout}
    dashboard={Dashboard}
    requireAuth
  >
    {/* Add a test resource - you can replace this with your actual resources */}
    {/* <Resource name="profiles" list={ListGuesser} /> */}
    <Resource name="profiles" list={ProfilesList} show={ProfileShow} />
    <Resource name="user_photos" list={UserPhotoList} />
    <Resource name="chat_rooms" list={ChatRoomList} />
    <Resource name="matches" list={MatchList} />
    <Resource name="fcm_tokens" list={FcmTokenList} />
    <Resource name="messages" list={MessagesList} />
    <Resource name="preferences" list={PreferencesList} />
    <Resource name="problems" list={ProblemsList} />
    <Resource name="staff_roles" list={StaffRolesList} />
    <Resource name="swipes" list={SwipesList} />
    <Resource name="user_locations" list={UserLocationsList} />
    <Resource name="user_presence" list={UserPresenceList} />
    <Resource name="user_blocks" list={ListGuesser} />

    {/* Custom Routes */}
    <CustomRoutes>
      <Route path="/user-map" element={<UserMapPage />} />
    </CustomRoutes>
  </Admin>
);
