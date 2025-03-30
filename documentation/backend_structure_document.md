# Backend Structure Document

This document outlines the backend architecture, hosting solutions, and infrastructure components for our self-hosted file storage and sharing application. Everything is explained in everyday language so that anyone—even without a technical background—can understand our approach.

## 1. Backend Architecture

Our backend is designed around the robust, out-of-the-box capabilities of Supabase. Supabase provides the underlying infrastructure for authentication, data management, and file storage. Key points include:

- **Design Patterns & Frameworks:**
  - Uses a service-oriented architecture where different services (authentication, file management, backups) are modular and communicate via APIs.
  - Adopts asynchronous processing for handling file uploads and backups to ensure that the application remains responsive, even during heavy operations.
  - Utilizes job queues for tasks like scheduled backups and file processing, ensuring that backup tasks are performed reliably without slowing down user interactions.

- **Scalability, Maintainability, & Performance:**
  - The modular design aids maintenance and allows individual components to scale with increased usage.
  - Load balancing techniques and optimized database queries ensure that the application performs well even as the number of users and stored files grows.
  - As new features are added or traffic increases, the clear separation between services means updating one part won’t affect the others.

## 2. Database Management

Our data is managed primarily via Supabase, which relies on PostgreSQL for handling structured data. Here’s how data management works in our project:

- **Technologies Used:**
  - **SQL Database:** PostgreSQL managed through Supabase
  - **Backend & Storage Services:** Supabase handles file storage and user authentication

- **Data Management Practices:**
  - Data is structured into different tables for users, files, backups, and sharing links. This structure ensures quick data lookups and efficient management of relationships between different pieces of information.
  - Regular database optimization is in place, including indexing and partitioning, to enhance performance as the data grows.
  - Automated backup strategies ensure no data is ever lost and that we can restore fast if needed.

## 3. Database Schema

In our simple human-readable format, here is an overview of the database schema we use:

- **Users Table:**
  - Stores basic user details such as user ID, email, password hash, and role (admin or standard user).
  - Maintains authentication tokens and login history for security and audit.

- **Files Table:**
  - Contains records for each uploaded file, including file ID, user ID (owner), file name, type, size, and storage path.
  - Includes metadata such as upload date and last modified timestamp.

- **Backups Table:**
  - Records backup events including backup ID, user ID, date of backup, type (one-click or scheduled), and the status of the backup.

- **Sharing Links Table:**
  - Manages information about file sharing links including link ID, associated file ID, type of link (temporary or permanent), expiry date (if applicable), and access count.

*For a SQL implementation, our schema might look like this in a simplified view (not actual code but an illustration):*

- Users: UserID (Primary Key), Email, PasswordHash, Role, CreatedAt, UpdatedAt
- Files: FileID (Primary Key), UserID (Foreign Key), FileName, FileType, FileSize, FilePath, UploadDate, LastModified
- Backups: BackupID (Primary Key), UserID (Foreign Key), BackupType, BackupDate, Status, StorageLocation
- SharingLinks: LinkID (Primary Key), FileID (Foreign Key), LinkType, ExpiryDate, AccessCount

## 4. API Design and Endpoints

Our APIs are designed to be easy to understand and follow RESTful principles. Here’s how they work:

- **General Approach:**
  - RESTful endpoints ensure that each X (like user, file, backup) has dedicated URLs that respond to standard operations (GET, POST, PUT, DELETE).
  - The APIs act as the bridge between the frontend (user interface) and the backend services, handling requests such as logging in, uploading files, generating sharing links, and creating backups.

- **Key Endpoints Include:**
  - **Authentication:** Endpoints for login, registration, token refresh, and logout. Uses Supabase authentication to secure user access.
  - **File Management:** Endpoints for uploading new files, listing files, updating file details, and deleting files.
  - **Backup Operations:** Endpoint for the one-click backup and an endpoint to schedule automated backups.
  - **File Sharing:** Endpoints to generate temporary (expiring) and permanent sharing links allowing controlled access.
  - **Admin Endpoints:** Special endpoints that let admin users manage overall user accounts, storage statistics, and access logs.

## 5. Hosting Solutions

The backend is designed to be self-hosted, allowing users to run the entire application on their own servers. Here’s how our hosting solution works:

- **Hosting Environment:**
  - The backend can be deployed on a dedicated server or on a cloud provider of choice (such as AWS, DigitalOcean, or even on a personal server).
  - Supabase itself can be self-hosted, offering flexibility for those who need complete control.

- **Benefits:**
  - **Reliability:** Ensured by the mature and battle-tested infrastructure of Supabase and PostgreSQL.
  - **Scalability:** Both the underlying database and service components are designed to efficiently scale with increased usage.
  - **Cost-Effectiveness:** Users can choose hosting options that suit their budget, especially useful for self-hosters who already have server capabilities or prefer a private cloud.

## 6. Infrastructure Components

Our infrastructure setup incorporates several key components that work in tandem to ensure smooth operation:

- **Load Balancers:** Distribute incoming requests evenly across backend servers to prevent any single server from overload.
- **Caching Mechanisms:** Improve response times with caching layers (integrated into Next.js and at the database query level) so repeated data requests are served faster.
- **Content Delivery Networks (CDNs):** While primarily focused on self-hosting, utilizing a CDN for static file assets (like UI libraries and icons) can boost performance geographically.
- **Job Queues:** Manage asynchronous processing tasks such as one-click and scheduled backups without impacting user experience.

## 7. Security Measures

To secure our users and their files, the backend employs several important security protocols:

- **Authentication & Authorization:**
  - Uses secure login with role-based access. Users are verified via Supabase, ensuring that only authorized users can access protected resources.
- **Data Encryption:**
  - Sensitive data such as passwords is stored using strong hashing techniques.
  - File transfers and API communications are encrypted (using HTTPS) to protect data in transit.
- **Regular Auditing:**
  - Access logs and user actions are monitored to detect and respond to any suspicious activities.

## 8. Monitoring and Maintenance

Ensuring our backend runs smoothly is a top priority. We use several strategies for monitoring and upkeep:

- **Monitoring Tools:**
  - Integrated tools in Supabase monitor database performance, API response times, and server health.
  - Log aggregation and alert systems help in quickly identifying and resolving issues.

- **Maintenance Strategies:**
  - Regular reviews and updates of the database schema, API endpoints, and server configurations.
  - Scheduled backups and updates help in keeping the system secure and efficient.
  - A proactive approach in scalability planning (load balancing and database optimization) ensures that as user numbers grow, the backend remains responsive and reliable.

## 9. Conclusion and Overall Backend Summary

In summary, the backend of our self-hosted file storage and sharing application is built on a well-thought-out structure with the following components:

- A modular architecture powered by Supabase that provides authentication, database, and storage services.
- Robust database management with PostgreSQL handling structured data and efficient indexing for performance.
- Clearly defined database schema covering users, files, backups, and sharing links.
- RESTful API endpoints that serve all core functionalities, from user login and file management to backup operations and admin controls.
- Flexible hosting solutions that allow deployment on either private servers or cloud services, tailored for self-hosters.
- Infrastructure components like load balancers, caching layers, CDNs, and job queues that ensure a fast, reliable, and scalable environment.
- Comprehensive security measures including robust authentication, encrypted communications, and regular monitoring to protect user data.
- Effective monitoring and maintenance plans that guarantee long-term reliability and smooth performance.

Overall, this backend setup is aligned with the project’s goals of delivering a secure, efficient, and easily maintainable file storage and sharing solution. Its flexibility and scalability make it a reliable choice for self-hosters who need to manage growing numbers of files and users while keeping data safe and accessible.