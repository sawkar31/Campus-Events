# Campus Event Management System

A comprehensive event management system for colleges with an admin portal and student mobile app, built with Express.js, SQLite, and vanilla HTML/CSS/JavaScript.

## Features

### Admin Portal
- **Event Management**: Create, edit, and delete events
- **Dashboard**: View statistics and analytics
- **Event Types**: Support for hackathons, workshops, tech talks, fests, competitions, and seminars
- **Registration Management**: Track student registrations and check-ins
- **Analytics**: View event statistics and participation rates

### Student App (PWA)
- **Event Discovery**: Browse and search events
- **Registration**: Register for events with real-time availability
- **Check-in**: Check-in on event day
- **Profile Management**: Update personal information
- **Mobile-First**: Responsive design optimized for mobile devices
- **Offline Support**: Progressive Web App capabilities

## Tech Stack

- **Backend**: Express.js, Node.js
- **Database**: SQLite
- **Authentication**: JWT tokens
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd campus-event-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Note**: The SQLite database will be automatically created and initialized when you start the server. A default admin account will be created with:
- Email: `admin@college.edu`
- Password: `admin123`

### 4. Start the Application

#### Start the Backend Server
```bash
npm start
# or for development
npm run dev
```

#### Start the Admin Portal
```bash
npm run admin
# Opens at http://localhost:3000
```

#### Start the Student App
```bash
npm run student
# Opens at http://localhost:3001
```

## Usage

### Admin Portal (http://localhost:3000)
1. Register as an admin or use the default credentials
2. Create events with detailed information
3. Monitor registrations and analytics
4. Manage event lifecycle

### Student App (http://localhost:3001)
1. Register as a student
2. Browse available events
3. Register for events
4. Check-in on event day
5. View your registered events

## API Endpoints

### Authentication
- `POST /api/auth/register-admin` - Register admin
- `POST /api/auth/login-admin` - Login admin
- `POST /api/auth/register-student` - Register student
- `POST /api/auth/login-student` - Login student

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)

### Students
- `POST /api/students/register-event` - Register for event
- `GET /api/students/my-events` - Get student's events
- `POST /api/students/check-in` - Check-in for event
- `GET /api/students/profile` - Get student profile

## Database Schema

### Tables
- **admins**: Admin user accounts
- **students**: Student user accounts
- **events**: Event information
- **event_registrations**: Student event registrations

### Key Features
- SQLite database with auto-incrementing primary keys
- Proper foreign key relationships
- Optimized indexes for performance
- Automatic database initialization

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention

## Mobile App Features

- Progressive Web App (PWA)
- Offline functionality
- Push notifications (can be added)
- Mobile-optimized UI
- Touch-friendly interactions

## Development

### Project Structure
```
├── admin-portal/          # Admin web interface
├── student-app/           # Student mobile app
├── routes/                # API routes
├── config/                # Configuration files
├── database/              # Database schema
├── server.js              # Main server file
└── package.json           # Dependencies
```

### Adding New Features
1. Create new routes in the `routes/` directory
2. Update the database schema if needed
3. Add frontend components
4. Test thoroughly

## Deployment

### Backend Deployment
1. Deploy to platforms like Heroku, Railway, or DigitalOcean
2. Set environment variables
3. Ensure database connection

### Frontend Deployment
1. Deploy admin portal to Netlify, Vercel, or similar
2. Deploy student app as PWA
3. Update API URLs for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository.
