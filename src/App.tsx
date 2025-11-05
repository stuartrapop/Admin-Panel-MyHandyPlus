import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router-dom";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { Layout } from "./Layout";
import { CustomLoginPage } from "./LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { EmailPreview } from "./pages/EmailPreview";
import { ProblemsList } from "./pages/problems";
import { ProfileShow, ProfilesList } from "./pages/profiles";
import { StaffRolesList } from "./pages/staffRoles";
import { UserBlocks } from "./pages/userBlocks";
import UserMapPage from "./pages/UserMapPage";
import { UsersDeletedList } from "./pages/usersDeleted";

export const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    loginPage={CustomLoginPage}
    layout={Layout}
    dashboard={Dashboard}
    requireAuth
  >
    {/* Resources in sidebar menu order */}
    <Resource name="profiles" list={ProfilesList} show={ProfileShow} />
    <Resource name="user_blocks" list={UserBlocks} />
    <Resource name="staff_roles" list={StaffRolesList} />
    <Resource name="users_deleted" list={UsersDeletedList} recordRepresentation="user_id" />
    <Resource name="problems" list={ProblemsList} />

    {/* Custom Routes */}
    <CustomRoutes>
      <Route path="/user-map" element={<UserMapPage />} />
      <Route path="/email-preview" element={<EmailPreview />} />
    </CustomRoutes>
  </Admin>
);
