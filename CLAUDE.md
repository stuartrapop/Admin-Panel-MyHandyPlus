# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-Admin based administration panel for MyHandiPlus, built with:

- **React-Admin 5.11** for the admin interface
- **Supabase** as the backend (authentication and database)
- **Vite** as the build tool
- **Material-UI** for UI components
- **TypeScript** for type safety
- **Leaflet/React-Leaflet** for map functionality

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run serve

# Type checking (without emitting files)
npm run type-check

# Lint and fix code
npm run lint

# Format code with Prettier
npm run format

# Deploy to GitHub Pages
npm run predeploy  # builds with GITHUB_PAGES=true
npm run deploy     # pushes to gh-pages branch
```

## Environment Setup

Create a `.env` file with these variables:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_API_KEY=your_supabase_anon_key
```

## Architecture Overview

### Authentication Flow

- **OTP-based login**: Users enter email, receive OTP, then verify to login
- **Role-based access**: Only users with `admin` or `moderator` roles in the `staff_roles` table can access the panel
- Authentication is handled by `src/authProvider.ts` using Supabase Auth

### Data Provider Architecture

The `src/dataProvider.ts` is the heart of data management:

1. **Custom RPC Function for Profiles**: The `profiles` resource uses a Supabase RPC function `search_profiles` that joins multiple tables (profiles, user_account_status, user_presence, emails, profile_attributes) to provide optimized querying with:
   - Email search (from `emails` table)
   - Gender filtering (from `profile_attributes` + `types_attributes`)
   - Status filtering (from `user_account_status`)
   - Last activity tracking (from `user_presence` table)
   - Profile photo URLs (computed from storage)
   - Pagination and sorting (including by last_activity)

2. **Composite Key Handling**: The `profile_attributes` table has a composite primary key (`profile_id`, `attribute_id`). The data provider synthesizes an `id` field as `${profile_id}-${attribute_id}` for React-Admin compatibility.

3. **Batch Profile Loading**: `getOne` for profiles searches through paginated batches (1000 records at a time) until it finds the requested profile, ensuring it works even with large datasets.

4. **Logging Wrapper**: All base data provider calls are wrapped with a Proxy that logs calls and results to the console for debugging.

### Database Schema Key Points

#### Core Tables

- `profiles`: User profile data (firstname, name, birthdate, bio, etc.)
- `emails`: Separate email table linked to profiles
- `user_account_status`: Account status (active, banned, paused, etc.)
- `user_presence`: User presence tracking (is_online, last_seen, last_activity, app_state, platform)
- `profile_attributes`: Many-to-many relationship between profiles and attributes
- `types_attributes`: Attribute definitions (gender, relationship types, etc.) organized by category
- `preferences`: User preferences including relationship type
- `user_blocks`: Users blocking other users
- `staff_roles`: Admin/moderator role assignments
- `users_deleted`: Soft-deleted user records
- `problems`: Reported problems/issues

#### SQL Views for Dashboard

Located in `admin-setup.sql` and `supabase-views.sql`:

- `admin_user_stats`: Aggregated user statistics by gender and status
- `admin_profiles_by_month`: Monthly profile creation trends
- `admin_relationship_stats`: Relationship type distribution
- `admin_user_location_stats`: Geographic distribution

These views use CTEs and optimized queries to avoid repeated EXISTS subqueries.

### Resource Organization

#### Pages (`src/pages/`)

- `Dashboard.tsx`: Main dashboard with statistics and charts using Recharts
- `profiles.tsx`: Profile list and detail views with filtering and editing
- `userBlocks.tsx`: User blocking relationships
- `staffRoles.tsx`: Admin/moderator role management
- `usersDeleted.tsx`: Soft-deleted users
- `problems.tsx`: Reported issues
- `UserMapPage.tsx`: Geographic map of users using Leaflet
- `EmailPreview.tsx`: Email template preview system

#### Components (`src/components/`)

Custom fields and UI components:

- `ProfilePhotoFieldOptimized.tsx`: Optimized photo display with Supabase storage
- `GalleryPhotos.tsx`: Photo gallery viewer
- `GenderField.tsx` / `GenderDropdown.tsx`: Gender display and editing
- `StatusDropdown.tsx`: Account status editor
- `EmailField.tsx`: Email display with account status info
- `DeleteUserButton.tsx`: User deletion with confirmation
- `CustomPagination.tsx`: Pagination controls
- `CustomMenu.tsx`: Navigation menu
- `ProfileReferenceField.tsx` / `ProfilePhotoReferenceField.tsx`: Reference field displays

### Image Handling

Profile photos are stored in Supabase Storage:

- Storage bucket: `profile_photos`
- URL format: Profile records can have a computed `profile_photo_url` field from the RPC function
- Transform options: Supabase image transformations are used (width, quality parameters)

### React-Admin Customization

- **Custom Login Page**: `LoginPage.tsx` with OTP flow
- **Custom Layout**: `Layout.tsx` with custom menu
- **Custom Routes**: Additional routes for `/user-map` and `/email-preview`
- **Custom Data Provider**: Extensive customization in `dataProvider.ts`

## Important Patterns

### When Working with Profiles

- Always use the `search_profiles` RPC function for list views (automatically handled by dataProvider)
- The RPC function returns enriched data with `gender_value`, `account_status`, `email`, `last_activity`, and `profile_photo_url`
- The `last_activity` field comes from the `user_presence` table and shows when the user was last active in the app
- Fallback to base provider is available if RPC fails, but with limited fields

### When Working with Composite Keys

- `profile_attributes` uses synthetic IDs: `"${profile_id}-${attribute_id}"`
- When creating queries, parse the ID back to its components
- The dataProvider handles this automatically in `getList`, `getMany`, and `getManyReference`

### When Adding New Resources

1. Add the resource to `App.tsx` with list/show/edit components
2. If the table has special requirements (joins, composite keys), override methods in `dataProvider.ts`
3. Create page components in `src/pages/`
4. Create custom fields in `src/components/` if needed

## Testing Database Setup

SQL files are provided to set up the database views:

- `admin-setup.sql`: Optimized dashboard views (recommended)
- `supabase-views.sql`: Additional utility views
- `database-integrity-check.sql`: Schema validation queries

Run these in the Supabase SQL Editor to create required database objects.

## Deployment

The app can be deployed to GitHub Pages:

- Repository name is configured in `vite.config.ts` as `/Admin-Panel-MyHandyPlus/`
- Base path changes between local dev (`./`) and GitHub Pages (`/Admin-Panel-MyHandyPlus/`)
- Use `npm run predeploy && npm run deploy` to build and publish

## Key Dependencies

- `react-admin`: ^5.11.0 - Main admin framework
- `ra-supabase`: ^3.4.0 - React-Admin Supabase integration
- `@supabase/supabase-js`: ^2.57.4 - Supabase client
- `@mui/material`: ^7.0.1 - Material-UI components
- `leaflet` / `react-leaflet`: Map functionality
- `recharts`: ^3.3.0 - Dashboard charts

## Claude Context

/claude_context.md/sql.md
