# Project Requirements Document (PRD)

## 1. Project Overview

This project is a self-hosted file storage and sharing application, built to give users a simple yet powerful alternative to large cloud services like Google Drive. The app is designed for self-hosters who need a reliable solution to upload, manage, and share files over their networks. With a modern and clean UI inspired by Shade UI components and Feather icons, the overall look and feel will be professional and user-friendly, making it accessible for both tech-savvy and less technical users.

The primary purpose of the application is to simplify file management and enhance data protection. A core feature, the one-click backup functionality, enables users to quickly create compressed archives of their files—ensuring data is securely preserved with minimal effort. With added features like role-based access (regular users and admins), file sharing with expiring or permanent links, and the option for scheduled automated backups, the app is being built to provide robust security, scalability, and an intuitive user interface. Success will be measured by the smooth user experience, ease of backup and restore operations, and the app’s capability to efficiently handle a growing number of files and users.

## 2. In-Scope vs. Out-of-Scope

### In-Scope

*   **User Authentication and Role Management:** Secure login/logout processes using Supabase, with standard user and admin roles.
*   **File Uploading and Management:** Ability to upload documents, images, videos, and compressed files with defined size limits (e.g., 100 MB per file). Organization and categorization of files using an intuitive File Manager interface.
*   **One-Click and Scheduled Backup Functionality:** Manual one-click backups that create a compressed archive (e.g., ZIP) of user files and support automated scheduled backups. Users can choose the backup destination (local partition or offsite storage).
*   **File Sharing Capabilities:** Generation of both temporary (expiring) and permanent sharing links for files.
*   **Modern and Responsive UI:** Implementation of a clean, minimalist design influenced by Shade UI blocks, Tailwind CSS styles, and Feather icons for seamless navigation.
*   **Integration with Supabase:** Utilize Supabase for database management, authentication, and file storage.
*   **Scalability and Performance Enhancements:** Database optimization, load balancing, asynchronous file operations, and caching strategies to efficiently handle growth in file volume and number of users.

### Out-of-Scope

*   Third-party integrations for payment processing or commercial transaction workflows.
*   Advanced editing or file manipulation tools (e.g., online document editing) beyond basic file management.
*   Mobile app versions; the initial release is focused on a web-based user interface.
*   Custom branding or extensive theming beyond basic modern aesthetics; placeholder logos and generic design elements will be used until specific branding guidelines are provided.
*   Extensive reporting or analytics features beyond simple logs and monitoring for admins.

## 3. User Flow

A new user’s journey starts at the Login Page, where they securely enter their credentials through a clean, modern interface powered by Supabase authentication. Once the details are verified, the user lands on the Dashboard which provides an overview of their file storage usage, backup status, and quick access links to the File Manager, Settings, and File Sharing sections. This dashboard serves as a centralized hub to monitor the system’s health and navigate easily to different parts of the app.

After reaching the Dashboard, the user proceeds to the File Manager page where they can upload, organize, and manage their files. Here, they are introduced to the one-click backup feature by a clearly marked “Backup Now” button, allowing them to instantly create a compressed archive of their data. From the File Manager, users can also navigate to the File Sharing interface to generate temporary or permanent sharing links as needed, or visit the Settings page to update account details and configure automated backup schedules. Admin users have an additional layer of access to system logs and user account management, ensuring efficient oversight in a multi-user environment.

## 4. Core Features (Bullet Points)

*   **User Authentication and Role Management:**

    *   Secure login/logout functionality with Supabase.
    *   Differentiation between standard users and administrators.

*   **File Uploading and Management:**

    *   Support for common file types (PDF, DOCX, JPG, PNG, MP4, ZIP, RAR).
    *   File size limit (e.g., 100 MB per file) to ensure smooth operations.
    *   An intuitive file management interface with capabilities to sort, rename, and categorize files.

*   **One-Click and Automated Backups:**

    *   Single button “Backup Now” on the File Manager page to create a compressed archive (e.g., ZIP file).
    *   Option for scheduled or automated backups.
    *   Flexible backup storage option—user selectable: local partition/drive or offsite/cloud.

*   **File Sharing Capabilities:**

    *   Ability to generate both temporary sharing links (with expiration) and permanent links.
    *   Clear visual indicators via Feather icons to distinguish link types.

*   **Responsive and Modern User Interface:**

    *   A design inspired by Google Drive and Nextcloud using Next.js, Tailwind CSS, and shadcn UI components.
    *   Consistent use of Feather icons for navigation and interactive elements.

## 5. Tech Stack & Tools

*   **Frontend:**

    *   Framework: Next.js 14 (using the app router) for a fast, SEO-friendly application.
    *   Styling: Tailwind CSS for efficient, responsive design.
    *   Components: shadcn UI components to provide a sleek modern look.
    *   Icons: Feather icons for uniform and attractive visuals in navigation and controls.

*   **Backend & Storage:**

    *   Supabase: For database management, user authentication, and file storage.
    *   Database: Supabase’s integrated database with support for indexing and partitioning.

*   **AI Integration:**

    *   Option for GPT-4: For generating help content or user guides integrated into the app.

*   **Development Tools:**

    *   IDE: Windsurf – a modern IDE with integrated AI coding capabilities, ensuring efficient development and debugging.

## 6. Non-Functional Requirements

*   **Performance:**

    *   Fast load and response times, targeting minimal delays during navigation and file operations.
    *   Optimized file upload and backup processes, with asynchronous operations handling larger workloads.

*   **Security:**

    *   Secure user authentication and role-based access to protect sensitive data.
    *   Encrypted file storage and secure backup mechanisms.

*   **Scalability:**

    *   Efficient handling of an increasing number of files and users through load balancing and database optimizations.
    *   Design considerations for horizontal scaling and resource monitoring.

*   **Usability:**

    *   Intuitive interfaces with clear navigation elements.
    *   Minimalistic, modern design ensuring high accessibility even for less technical users.

## 7. Constraints & Assumptions

*   **Constraints:**

    *   The application is self-hosted and must run in environments with typical server capacity and bandwidth limits.
    *   Maximum file upload size is constrained (e.g., 100 MB per file) to optimize server performance.
    *   Backup storage options assume availability of either additional local partitions or offsite storage configurations.
    *   The app depends on Supabase for core backend functionalities, meaning any downtime or limitations on Supabase could affect the application.

*   **Assumptions:**

    *   Users have basic familiarity with web interfaces and file management concepts.
    *   The design emphasizes simplicity and uniformity, leveraging standard modern design practices (e.g., the use of 'Inter' or 'Roboto' for readable typography).
    *   The system is developed for environments where self-hosting is feasible, with sufficient control over server resources.
    *   GPT-4 integration for help content is optional and can be enabled based on user configuration or administrative settings.

## 8. Known Issues & Potential Pitfalls

*   **Backup Storage Configuration:**

    *   There may be ambiguities in selecting and configuring backup storage locations (local partition vs. offsite/cloud). A guided configuration wizard or clear instructions in the UI can help mitigate user confusion.

*   **File Handling and Asynchronous Processing:**

    *   Handling large file uploads or extensive backup processes asynchronously might introduce challenges in maintaining UI responsiveness. Implementing robust job queue systems and real-time progress indicators can mitigate these issues.

*   **Role-Based Access Concerns:**

    *   Differentiating between standard and admin permission levels adds complexity. Clear, well-documented role boundaries and testing of all permission flows are essential to avoid security loopholes.

*   **Scalability Under Load:**

    *   As file volumes increase, database performance might degrade if indexing or partitioning strategies are not effectively implemented. Regular resource monitoring and scaling strategies are required.

*   **Third-Party Service Dependencies:**

    *   The application’s performance relies on Supabase and any integrated AI tools (like GPT-4). It is important to plan for potential outages or rate limits of these services, with fallback procedures to maintain user experience.

This PRD provides a detailed description and clear guidance for building a self-hosted file storage and sharing app with modern UI and robust backup capabilities. All subsequent technical documents (Tech Stack, Frontend Guidelines, Backend Structure, etc.) should follow these specifications without ambiguity.
