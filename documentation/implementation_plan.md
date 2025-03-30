# Implementation plan

## Phase 1: Environment Setup

1. **Prevalidation:** Check if the current directory is already an existing project (e.g., check for essential folders like `/app` or `/pages`) before initializing a new project. (Project Summary)

2. **Node.js and Next.js Setup:** Ensure Node.js v20.2.1 is installed. If not, install Node.js v20.2.1. Then, initialize a new Next.js 14 project (note that Next.js 14 is selected for its compatibility with AI coding tools). (Tech Stack: Frontend)
   - Command: `npx create-next-app@14 your-project-name`

3. **Tailwind CSS Setup:** In the newly created project, install and configure Tailwind CSS. (Tech Stack: Frontend)
   - Follow instructions from the Tailwind CSS docs and set up the configuration in `tailwind.config.js`.

4. **shadcn UI and Feather Icons Integration:** Install shadcn UI library and Feather icons in the project.
   - Example command: `npm install @shadcn/ui feather-icons`
   - Validate installation by importing one icon in a sample component.

5. **Windsurf MCP Configuration for Supabase:**
   - Open the Cascade assistant in Windsurf.
   - Tap on the hammer (MCP) icon, then choose **Configure** to open the configuration file.
   - Add the following configuration (for both macOS and Windows):
     - macOS configuration:
       ```json
       { "mcpServers": { "supabase": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }
       ```
     - Windows configuration:
       ```json
       { "mcpServers": { "supabase": { "command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }
       ```
   - Display this link to obtain the connection string: [https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp](https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp). After receiving the connection string from the user, replace `<connection-string>` accordingly. (Tech Stack: IDE)

6. **Validation:** In Windsurf's Settings/MCP, verify that the MCP server status turns green indicating a successful connection to Supabase.

## Phase 2: Frontend Development

7. **Login Page Implementation:** Create the Login page component at `app/login/page.js`. Use shadcn UI components, Tailwind CSS, and Feather icons for a modern, responsive design. (Project Summary: UI)

8. **Dashboard Page:** Create a Dashboard page at `app/dashboard/page.js` to display file overview and storage status. (Project Summary: App Structure)

9. **File Manager Page:** Implement a File Manager page at `app/file-manager/page.js` where users can upload, organize, and manage files. Ensure upload components validate file sizes up to 100MB. (Project Summary: File Management)

10. **Settings Page:** Create a Settings page at `app/settings/page.js` for account management and backup settings configuration. (Project Summary: App Structure)

11. **File Sharing Interface:** Develop a File Sharing interface at `app/share/page.js` that allows generating both temporary (expiring) and permanent sharing links. (Project Summary: File Sharing)

12. **One-Click Backup UI:** In the File Manager page or its own dedicated component (e.g., `app/file-manager/BackupButton.js`), implement a one-click backup button that triggers the creation of a ZIP archive for backup. Also, add options for scheduled backups. (Project Summary: Backup)

13. **API Integration Setup:** Create a service file at `app/services/supabase.js` to handle API calls for authentication, file management, sharing, and backups via Supabase. (Project Summary: User Authentication, File Management)

14. **Validation:** Run the Next.js development server (`npm run dev`) and manually test the responsive UI across Login, Dashboard, File Manager, Settings, and Share pages.

## Phase 3: Backend Development

15. **Supabase Database Schema Design:** Define the PostgreSQL schema for Supabase. Plan for the following tables:
    - Users (use Supabase Auth for authentication; additional fields if needed for roles)
    - Files: Columns may include file_id, user_id (foreign key), filename, file_size, file_type, upload_date, storage_path, etc.
    - Backups: Columns may include backup_id, user_id, backup_date, backup_path, backup_type (one-click or scheduled).
    - File_Shares: Columns for share_id, file_id (foreign key), share_type (temporary or permanent), expiry_date (nullable), share_link, etc. (Project Summary: Key Requirements)

16. **Supabase MCP Table Creation:** Using the Supabase MCP server configured earlier, execute SQL commands to create the required tables. For example, create a SQL file at `/supabase/schema.sql` containing table definitions. (Tech Stack: Supabase)

17. **Example SQL Schema (in `/supabase/schema.sql`):**
    ```sql
    -- Users table is managed by Supabase Auth
    CREATE TABLE IF NOT EXISTS files (
      file_id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      file_size INTEGER CHECK (file_size <= 104857600), -- limit 100MB
      file_type TEXT,
      upload_date TIMESTAMPTZ DEFAULT NOW(),
      storage_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backups (
      backup_id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      backup_date TIMESTAMPTZ DEFAULT NOW(),
      backup_path TEXT NOT NULL,
      backup_type TEXT CHECK (backup_type IN ('one-click', 'scheduled'))
    );

    CREATE TABLE IF NOT EXISTS file_shares (
      share_id SERIAL PRIMARY KEY,
      file_id INTEGER REFERENCES files(file_id) ON DELETE CASCADE,
      share_type TEXT CHECK (share_type IN ('temporary', 'permanent')),
      expiry_date TIMESTAMPTZ,
      share_link TEXT NOT NULL
    );
    ```

18. **Deploy Schema Using MCP:** Run the following command via the Supabase MCP server to execute the schema creation (after replacing `<connection-string>` if necessary):
    - For macOS: `npx -y @modelcontextprotocol/server-postgres -c /supabase/schema.sql`
    - For Windows: `cmd /c npx -y @modelcontextprotocol/server-postgres -c /supabase/schema.sql`

19. **Backend API Endpoints:** Implement API routes in Next.js under `app/api` for file uploads, downloads, backup initiation, and share link generation. For example:
    - Create `app/api/files/upload/route.js` for file uploads with size validation.
    - Create `app/api/backup/route.js` to trigger a one‐click backup (ZIP creation) and schedule backups.
    - Create `app/api/share/route.js` to generate sharing links. (Project Summary: File Management, Backup, File Sharing)

20. **User Role and Access Management:** Incorporate role checks (standard user vs admin) in API endpoints, ensuring that admin endpoints (e.g., user management, global settings) validate the user’s role from Supabase Auth. (Project Summary: User Roles)

21. **Validation:** Test the Supabase schema by connecting via Supabase dashboard and verifying table creation and constraints. Use sample queries to ensure limits on file sizes and correct foreign key references.

## Phase 4: Integration

22. **Frontend to Backend Integration:** In the service file (`app/services/supabase.js`), integrate API calls from the frontend with the backend routes for file uploads, authentication, backups, and sharing. (Project Summary: Integration)

23. **File Upload and Management:** Connect the File Manager UI components to the upload API endpoint. Ensure the UI shows progress and file status. (Project Summary: File Management)

24. **Backup Integration:** Wire the one-click backup button with the `/api/backup` endpoint to trigger ZIP archive creation. Also, integrate scheduling functionality through the API. (Project Summary: Backup)

25. **Share Link Generation:** Connect the file sharing interface to the `/api/share` endpoint, allowing users to generate temporary or permanent links. (Project Summary: File Sharing)

26. **Admin Dashboard Features:** On the Dashboard and Settings pages, integrate admin functionalities like user management, storage monitoring, and log access by calling the dedicated admin API endpoints. (Project Summary: Admin Role)

27. **Validation:** Perform integration testing by simulating user actions (login, file upload, backup initiation, sharing link generation) and verifying that the frontend and backend communicate correctly.

## Phase 5: Deployment

28. **Local Testing and Build:** Run end-to-end tests locally using Next.js test runner and verify that all pages (Login, Dashboard, File Manager, Settings, Share) function correctly. (Non-Functional Requirements: Performance, Usability)

29. **CI/CD Pipeline Setup:** Configure a CI/CD pipeline (e.g., GitHub Actions) to run tests on push and build the Next.js application. Include steps in your pipeline configuration file (e.g., `.github/workflows/ci.yaml`). (Non-Functional Requirements: Scalability)

30. **Deployment to Production Server:** Deploy the Next.js app to your chosen hosting provider ensuring environment variables for Supabase are correctly set. (Tech Stack: Frontend & Backend)

31. **Validation:** After deployment, manually test authentication, file uploads, backup processing, and share link generation on the production URL. (Non-Functional Requirements: Security, Performance)

## Final Checks and Edge Case Handling

32. **Role-Based Access Test:** Verify that only admins can access admin-specific endpoints and pages. (Project Summary: User Roles)

33. **File Size Validation Test:** Attempt to upload a file over 100MB and verify that the upload is blocked. (Project Summary: File Management)

34. **Backup Functionality Test:** Test both one-click and scheduled backups to ensure ZIP archives are generated and stored per configuration. (Project Summary: Backup)

35. **Share Link Expiry Check:** Create a temporary share link and verify it expires as expected. (Project Summary: File Sharing)

36. **UI Responsiveness Test:** Use different screen sizes to confirm the modern responsive design works across devices. (Non-Functional Requirements: Usability)

37. **Performance Monitoring:** Enable logging and performance monitoring in your production environment to monitor load and scalability. (Project Summary: Scalability)

38. **Documentation:** Update project documentation with setup instructions, API documentation, and user guides. Include a section for troubleshooting common issues and how to retrieve Supabase connection details if needed.

39. **Final Validation:** Conduct a full end-to-end test simulating typical user workflows (login, file management, backup, file sharing) and record results. (Project Summary, Non-Functional Requirements)

40. **Rollback Plan:** Prepare a rollback plan and ensure version control is active with clear commit messages for future updates.

This detailed plan lays out all required steps, ensuring alignment with the provided project summary, tech stack, and design requirements. Follow each step sequentially and perform the corresponding validations as outlined.