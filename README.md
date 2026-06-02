Brilliant Connect Ticketing System
A full-featured internal ticketing portal built with Next.js 15, Tailwind CSS v4, and App Router, migrated and extended from a legacy React CRA application.

Features

Authentication — Login, forgot password, reset password via email verification
Role-based access control — 5 user types (admin, hod, sales, manager, support, client) each with scoped permissions and UI visibility
Ticket Management — Issue, pick, drop, forward, resolve tickets with full thread history and file attachments
Root Cause Analysis — Mandatory root cause summary before ticket resolution, with full history view
Smart Filters & Search — Filter by status, priority, service type, date range; search by Ticket ID, Company Name, or Service
Dashboard — Real-time ticket statistics with pie chart breakdown, clickable cards for status-based navigation
Assigned & Forwarded Tickets — Dedicated views for tickets assigned to or forwarded by the logged-in user
KPI Reports — Department/service-type report and user-wise summary report, generated as downloadable Excel files with live preview
Topic Management — Admin-only CRUD interface for managing ticket title suggestions per service type
Trash System — Soft delete tickets to trash, restore, permanently delete, or clear trash entirely
Internal & External Comments — Non-client users can toggle between internal (private) and external (client-visible) comments
Edit Profile — Update personal info, department, team; manage company secondary emails


Tech Stack
LayerTechnologyFrameworkNext.js 15.5 (App Router)StylingTailwind CSS v4Rich Textreact-quill-newChartsreact-apexchartsFile UploadAWS S3 (presigned POST)HTTP ClientAxios with JWT interceptorExcel PreviewSheetJS (xlsx) + Office Online ViewerDate Formattingdate-and-time

User Roles
RoleAccessadminFull system control, topic management, trashhod / salesAll tickets, KPI reportsmanagerDepartment-scoped tickets, update title/prioritysupportTeam-scoped tickets, update title/priorityclientOwn tickets only, no internal features
