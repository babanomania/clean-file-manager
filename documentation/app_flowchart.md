flowchart TD
    LoginPage[Login Page]
    Dashboard[Dashboard - File Overview and Storage Status]
    FileManager[File Manager Page]
    Settings[Settings Page - Account Management and Backup Configuration]
    FileSharing[File Sharing Interface]
    AdminPanel[Admin Panel - Manage Users and Global Settings]
    FileUpload[File Upload and Management - (Max size 100MB)]
    Backup[Backup Now - Create ZIP Archive]
    ScheduledBackup[Schedule and Automate Backups]
    ShareLink[Generate Share Links - Expiring and Permanent]

    LoginPage --> Dashboard
    Dashboard --> FileManager
    Dashboard --> Settings
    Dashboard --> AdminPanel
    FileManager --> FileUpload
    FileManager --> Backup
    FileManager --> ShareLink
    Settings --> ScheduledBackup
    ScheduledBackup --> Backup
    AdminPanel --> FileUpload
    AdminPanel --> Settings
    FileSharing --> ShareLink