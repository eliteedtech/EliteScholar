# Elite Scholar - School Management System

## Overview

Elite Scholar is a comprehensive School Management System MVP built as a full-stack web application. The platform provides invoice management, payment tracking, school administration, and feature management capabilities for educational institutions. The system supports multiple school types (K12 and Nigerian curriculum) with role-based access control spanning from super administrators to individual students and parents.

## User Preferences

Preferred communication style: Simple, everyday language.

## Login Credentials

**Super Admin Account:**
- Email: admin@elitescholar.com
- Password: SuperAdmin123!
- Role: Super Administrator with full system access

**Demo School Admin Account:**
- Email: schooladmin@demo.com
- Password: SchoolAdmin123!
- Role: School Administrator with school-level management access

**Demo Teacher Account:**
- Email: teacher@demo.com
- Password: Teacher123!
- Role: Teacher with classroom management access

**Demo Student Account:**
- Email: student@demo.com
- Password: Student123!
- Role: Student with limited portal access

**Demo Parent Account:**
- Email: parent@demo.com
- Password: Parent123!
- Role: Parent with child monitoring access

Use the Super Admin credentials to access the main dashboard and manage schools, invoices, and feature toggles. Other accounts can be used to test role-based access controls.

## System Architecture

### Frontend Architecture
The client-side is built using **Vite + React + TypeScript** with a component-based architecture:

- **UI Framework**: React with TypeScript for type safety
- **Styling**: TailwindCSS with shadcn/ui component library for consistent design
- **Routing**: Wouter for lightweight client-side routing with role-based route protection
- **State Management**: 
  - Zustand for local UI state (auth store)
  - React Query (TanStack Query) for server state management and caching
- **Code Splitting**: React.lazy + Suspense for route-level code splitting
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
The server-side follows a **Node.js + Express + TypeScript** REST API pattern:

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT-based authentication with role-based access control
- **File Uploads**: Multer with Cloudinary integration for image storage
- **Email Service**: Nodemailer for transactional emails
- **Middleware**: Custom auth, feature toggle, and payment verification middleware

### Database Design
PostgreSQL database with Drizzle ORM featuring:

- **User Management**: Multi-role user system (superadmin, school_admin, branch_admin, teacher, student, parent)
- **School Structure**: Schools with branches, grade sections with section references based on curriculum type
- **Automatic Grade Section Creation**: When schools are created, grade sections are automatically generated with section IDs
- **Feature System**: Modular features with per-school toggles
- **Invoice System**: Complete invoicing with line items, unit measurements, and negotiated pricing
- **Subscription Management**: School payment status and access control

### Authentication & Authorization
JWT-based authentication system with:

- **Role-based Access Control**: Six distinct user roles with hierarchical permissions
- **School Association**: Users tied to specific schools/branches for data isolation
- **Feature Toggles**: Per-school feature enablement stored in database
- **Payment Verification**: Middleware to block access for unpaid schools

### Modular Architecture
The system is designed with independent modules:

- **Super Admin Module**: School management, invoice creation, feature toggles
- **Invoice Module**: Enhanced invoice generation with unit measurements, negotiated pricing, payment tracking, email notifications
- **Grade Management**: Automatic grade section creation with section IDs for proper student organization
- **Auth Module**: User authentication, role management, password policies
- Each module has dedicated routes, database models, and frontend components

### Recent Enhancements (August 2025)
- **Enhanced Grade Section Management**: Added section_id field to grade_sections table for proper referencing
- **Automatic Grade Creation**: Schools now automatically generate appropriate grade sections based on curriculum type (K12 vs Nigerian)
- **Enhanced Invoice System**: Added unit measurements (per_student, per_staff, etc.), negotiated pricing, and date ranges
- **Section-Based Organization**: Grade sections now include multiple sections (A, B, C) per grade for better student organization

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database via DATABASE_URL environment variable
- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database operations with schema migrations

### Cloud Services
- **Cloudinary**: Image upload and transformation service
  - Cloud storage for school logos and profile images
  - Automatic image optimization and transformations
  - Requires CLOUDINARY_URL, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### Email Service
- **Nodemailer**: Email delivery for notifications and invoices
- **SMTP Configuration**: Configurable email provider (defaults to Gmail)
- Environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

### UI Components & Styling
- **shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Headless UI primitives for complex components
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development & Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimizations

### Authentication & Security
- **bcrypt**: Password hashing for secure user authentication
- **jsonwebtoken**: JWT token generation and verification
- **cors**: Cross-origin request handling

### Form & Data Validation
- **Zod**: Schema validation for forms and API endpoints
- **React Hook Form**: Form state management with validation
- **@hookform/resolvers**: Zod integration for React Hook Form