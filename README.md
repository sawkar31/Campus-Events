Got it 👍 — here’s the clean **README.md code** without any emojis/icons, ready to use in your project:

````markdown
# Campus Event Management System

A complete event management platform designed specifically for colleges.  
It comes with an **Admin Portal** for event organizers and a **Student App (PWA)** for participants.  
Built with **Express.js, SQLite, and vanilla HTML/CSS/JavaScript**, it’s lightweight, simple, and effective.

---

## Key Features

### Admin Portal
- Event Management: Create, update, and remove events anytime  
- Dashboard: Quick overview of event stats and participation numbers  
- Multiple Event Types: Hackathons, workshops, talks, fests, competitions, seminars, and more  
- Registration Tracking: Manage student sign-ups and attendance  
- Analytics: Insights into participation trends and engagement  

### Student App (Progressive Web App)
- Event Discovery: Search and explore upcoming events  
- One-Click Registration: Sign up instantly with real-time availability checks  
- Check-in System: Simple QR or click-based check-in on event day  
- Profile Management: Keep personal details up-to-date  
- Mobile-First: Designed with responsive layouts for phones  
- Offline Access: Works even with limited or no internet connection  

---

## Tech Stack
- Backend: Express.js + Node.js  
- Database: SQLite (lightweight, auto-initialized)  
- Authentication: JWT-based secure login  
- Frontend: HTML5, CSS3, JavaScript (ES6+)  
- PWA Support: Service Worker + Web App Manifest  

---

## Setup Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd campus-event-management
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the root folder:

```env
# JWT Settings
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Server Settings
PORT=5000
NODE_ENV=development
```

Note: The system auto-creates the database on first run.
A default admin account is also set up:

* Email: `admin@college.edu`
* Password: `admin123`

### 4. Run the App

**Start Backend**

```bash
npm start
# or use for development
npm run dev
```

**Launch Admin Portal**

```bash
npm run admin
# Opens at http://localhost:3000
```

**Launch Student App**

```bash
npm run student
# Opens at http://localhost:3001
```

---

## How to Use

### Admin Portal → [http://localhost:3000](http://localhost:3000)

1. Login with default or new admin account
2. Create events with details like time, venue, and type
3. Track registrations and attendance
4. Monitor analytics

### Student App → [http://localhost:3001](http://localhost:3001)

1. Sign up as a student
2. Browse events and register
3. Check in on event day
4. View registered events anytime

---

## API Endpoints

### Authentication

* `POST /api/auth/register-admin` → New admin registration
* `POST /api/auth/login-admin` → Admin login
* `POST /api/auth/register-student` → Student registration
* `POST /api/auth/login-student` → Student login

### Events

* `GET /api/events` → List all events
* `GET /api/events/:id` → Get details of one event
* `POST /api/events` → Add event (Admin only)
* `PUT /api/events/:id` → Update event (Admin only)
* `DELETE /api/events/:id` → Remove event (Admin only)

### Students

* `POST /api/students/register-event` → Register for an event
* `GET /api/students/my-events` → Student’s registered events
* `POST /api/students/check-in` → Mark event attendance
* `GET /api/students/profile` → View student profile

---

## Database Structure

* **admins** → Admin users
* **students** → Student users
* **events** → Event details
* **event\_registrations** → Links students to events

Features:

* Auto-increment IDs
* Foreign keys for relationships
* Indexed for performance
* Database auto-setup on first run

---

## Security Highlights

* JWT authentication
* Hashed passwords (bcrypt)
* Rate limiting for requests
* CORS enabled & configured
* Input validation
* Safe from SQL injections

---

## Mobile App Benefits

* PWA with offline mode
* Push notifications (optional add-on)
* Fast, mobile-optimized design
* Easy, touch-friendly interface

---

## Project Layout

```
├── admin-portal/      # Web dashboard for admins
├── student-app/       # Mobile-first student app (PWA)
├── routes/            # API route handlers
├── config/            # Config & environment setup
├── database/          # Schema & DB initialization
├── server.js          # Entry point for backend
└── package.json       # Node dependencies
```

---

## Adding Features

1. Add new routes in `routes/`
2. Update DB schema if needed
3. Extend frontend (Admin/Student UI)
4. Test end-to-end before release

---

## Deployment

**Backend**

* Deploy on platforms like Heroku, Railway, or DigitalOcean
* Set environment variables in server
* Ensure SQLite DB is accessible

**Frontend**

* Host Admin Portal on Netlify/Vercel
* Deploy Student App as PWA
* Point API requests to production server

---

## Contribution Guide

1. Fork this repo
2. Create a new feature branch
3. Implement and test your changes
4. Submit a Pull Request

---

## License

Released under the **MIT License**. See LICENSE file for details.

---

## Support

For any issues, suggestions, or questions, please open an issue in the repository.

```

Do you also want me to **add a professional GitHub-style banner and badges (like build status, license, tech stack)** at the top of the README?
```
