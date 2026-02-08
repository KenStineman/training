# Double Helix Training Platform

A multi-course training attendance tracking and certification web application built for Double Helix LLC.

## Features

- **Multi-Course Support**: Create and manage multiple training courses
- **QR Code Attendance**: Attendees scan QR codes to check in each day
- **Configurable Surveys**: Add custom survey questions for each day
- **Certificate Generation**: Automatic PDF certificate generation
- **Email Delivery**: Send certificates via email with verification links
- **Admin Dashboard**: Full course and attendance management

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Netlify Functions (serverless)
- **Database**: Netlify DB (Postgres via Neon)
- **Auth**: Netlify Identity with Google OAuth
- **PDF**: pdf-lib for certificate generation
- **Email**: Resend for sending certificates

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Netlify CLI (`npm install -g netlify-cli`)
- A Netlify account

### Local Development

1. Clone the repository:
   ```bash
   git clone <your-repo>
   cd training
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize Netlify DB:
   ```bash
   npx netlify db init
   ```

4. Link to your Netlify site:
   ```bash
   netlify link
   ```

5. Pull environment variables:
   ```bash
   netlify env:pull
   ```

6. Start the development server:
   ```bash
   netlify dev
   ```

7. Open http://localhost:8888/training/

### Database Setup

1. Go to Netlify Dashboard > Your Site > Neon extension
2. Click "Open Neon Console"
3. Run the SQL from `database/schema.sql`

### Environment Variables

Set these in your Netlify dashboard (Site Settings > Environment Variables):

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Auto-configured by Netlify DB | Yes |
| `RESEND_API_KEY` | Resend API key for sending emails | Optional* |
| `EMAIL_FROM` | Sender email (e.g., `training@double-helix.com`) | Optional* |

*Required for email functionality

### Netlify Identity Setup

1. Go to Netlify Dashboard > Site Settings > Identity
2. Click "Enable Identity"
3. Under "Registration preferences", select "Invite only"
4. Under "External providers", click "Add provider" > "Google"
5. Configure Google OAuth credentials
6. Under "Registration", add email domain restriction: `double-helix.com`

## Deployment

### Deploy to Netlify

1. Push to your Git repository
2. Connect to Netlify via the dashboard
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Deploy!

### Manual Deploy

```bash
netlify deploy --prod
```

## Project Structure

```
training/
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── ui/                   # Reusable (Button, Input, Card, etc.)
│   │   ├── layout/               # Header, Footer, AdminLayout
│   │   ├── attendance/           # Check-in forms
│   │   ├── admin/                # Admin-specific components
│   │   └── certificate/          # Certificate display
│   ├── pages/                    # Page components
│   │   ├── admin/                # Admin pages
│   │   └── *.jsx                 # Public pages
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utilities (api, auth, helpers)
│   └── config/                   # App configuration
├── netlify/functions/            # Serverless API
│   ├── _shared/                  # Shared utilities (db, auth, response)
│   ├── courses.js                # Public course endpoints
│   ├── attendance.js             # Attendance submission
│   ├── certificates.js           # Certificate verification/download
│   ├── admin-courses.js          # Admin course CRUD
│   ├── admin-course-details.js   # Admin trainers/days/attendance
│   └── admin-send-certificates.js# Email sending
├── database/
│   └── schema.sql                # PostgreSQL schema
├── public/                       # Static assets
│   ├── images/                   # Logo and images
│   └── favicon.svg
├── netlify.toml                  # Netlify configuration
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
└── package.json
```

## URL Routes

### Public Routes
- `/training/` - Home page
- `/training/attend/:slug/:day` - Attendance check-in (QR code target)
- `/training/cert/:code` - Certificate verification

### Admin Routes (requires authentication)
- `/training/admin` - Dashboard
- `/training/admin/courses` - Course list
- `/training/admin/courses/new` - Create course
- `/training/admin/courses/:id` - Edit course
- `/training/admin/courses/:id/attendance` - Attendance report
- `/training/admin/courses/:id/certificates` - Certificate management

## API Endpoints

### Public API
- `GET /api/courses/:slug` - Course info
- `GET /api/courses/:slug/day/:day` - Day info with survey questions
- `POST /api/attendance` - Submit attendance
- `GET /api/certificates/:code` - Verify certificate
- `GET /api/certificates/:code/pdf` - Download certificate PDF

### Admin API (requires authentication)
- `GET /api/admin/courses` - List courses
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses/:id` - Get course details
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `PUT /api/admin/courses/:id/trainers` - Update trainers
- `PUT /api/admin/courses/:id/days` - Update days and questions
- `GET /api/admin/courses/:id/attendance` - Attendance report
- `POST /api/admin/courses/:id/certificates` - Generate certificates
- `GET /api/admin/courses/:id/certificates` - List certificates
- `POST /api/admin/certificates/send` - Send certificate emails

## Usage

### Creating a Course

1. Log in as admin at `/training/admin`
2. Click "Create New Course"
3. Fill in course details:
   - Name and URL slug
   - Number of days
   - Certificate type (completion/participation/both)
4. Add trainers
5. Configure days with optional survey questions

### Recording Attendance

1. Generate QR codes for each day's URL:
   - Day 1: `https://your-site.com/training/attend/course-slug/1`
   - Day 2: `https://your-site.com/training/attend/course-slug/2`
   - etc.
2. Attendees scan the QR code on their phones
3. They enter their email, name, and answer any survey questions
4. Attendance is recorded in the database

### Generating Certificates

1. Go to Admin > Course > Certificates
2. Click "Generate Certificates"
3. Select certificates to email
4. Click "Send Emails"
5. Attendees receive an email with a link to view/download their certificate

## Customization

### Branding

1. Add your logo to `public/images/logo.png`
2. Update colors in `tailwind.config.js`
3. Modify certificate template in `netlify/functions/certificates.js`

### Survey Questions

Survey questions support these types:
- `text` - Free text response
- `rating` - 1-5 star rating
- `multiple_choice` - Radio button options
- `yes_no` - Yes/No radio buttons

## License

Proprietary - Double Helix LLC

## Support

Contact: support@double-helix.com
