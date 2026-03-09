# Trello Clone

A full-stack Trello-like project management application built with React and Node.js. Features real-time collaboration, drag-and-drop kanban boards, multiple views (Board, Table, Calendar, Dashboard), and a modern dark-themed UI.

## Features

- **Authentication** - Register/login with JWT-based authentication
- **Board Management** - Create, edit, delete, and star boards with custom backgrounds
- **Kanban Board** - Drag-and-drop cards between lists using @dnd-kit
- **Card Details** - Rich card editing with descriptions, labels, due dates, checklists, comments, members, and covers
- **Multiple Views** - Board (Kanban), Table, Calendar (month/week/day) and Dashboard views
- **Search** - Search cards across all boards from the navbar
- **Board Members** - Invite members to boards by email
- **Real-time Updates** - Socket.IO for live collaboration
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

### Frontend

- React 19, React Router 7, Vite 7
- @dnd-kit (drag and drop)
- Axios, Socket.IO Client
- Lucide React (icons), date-fns, react-hot-toast

### Backend

- Node.js, Express 5
- MongoDB with Mongoose
- JWT Authentication (jsonwebtoken, bcryptjs)
- express-validator for input validation
- Socket.IO for real-time events

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/mdsarfarajali/trello-clone.git
cd trello-clone
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Set up backend environment variables:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/trello-clone
JWT_SECRET=your_secure_random_secret_here
CLIENT_URL=http://localhost:5173
```

4. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

5. Start development servers:

Backend:

```bash
cd backend
npm run dev
```

Frontend (in a new terminal):

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
trello-clone/
├── backend/
│   ├── server.js          # Express + Socket.IO server
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   ├── models/
│   │   ├── User.js        # User model
│   │   ├── Board.js       # Board model with labels
│   │   ├── List.js        # List model
│   │   └── Card.js        # Card model with checklists, comments
│   └── routes/
│       ├── auth.js        # Register, login, get current user
│       ├── boards.js      # Board CRUD, member management, search
│       ├── cards.js       # Card CRUD, move, members, comments
│       └── lists.js       # List CRUD, reorder
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx       # Entry point
│       ├── App.jsx        # Routes and auth guards
│       ├── api.js         # Axios instance with auth interceptor
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── AppNavbar.jsx      # Navigation with search
│       │   ├── CardComponent.jsx  # Card in kanban column
│       │   ├── CardModal.jsx      # Full card detail modal
│       │   ├── InlineCalendar.jsx # Embedded calendar
│       │   └── SortableList.jsx   # Kanban list column
│       └── pages/
│           ├── LandingPage.jsx    # Marketing page
│           ├── AuthPages.jsx      # Login and register
│           ├── DashboardPage.jsx  # Boards listing
│           ├── BoardPage.jsx      # Main board page
│           └── CalendarPage.jsx   # Full calendar view
```

## API Endpoints

### Auth

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login             |
| GET    | `/api/auth/me`       | Get current user  |

### Boards

| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| GET    | `/api/boards`                     | Get all user boards        |
| POST   | `/api/boards`                     | Create board               |
| GET    | `/api/boards/:id`                 | Get board with lists/cards |
| PUT    | `/api/boards/:id`                 | Update board               |
| DELETE | `/api/boards/:id`                 | Delete board               |
| POST   | `/api/boards/:id/members`         | Invite member by email     |
| DELETE | `/api/boards/:id/members/:userId` | Remove member              |
| GET    | `/api/boards/search/cards?q=`     | Search cards               |

### Lists

| Method | Endpoint             | Description   |
| ------ | -------------------- | ------------- |
| POST   | `/api/lists`         | Create list   |
| PUT    | `/api/lists/:id`     | Update list   |
| DELETE | `/api/lists/:id`     | Delete list   |
| POST   | `/api/lists/reorder` | Reorder lists |

### Cards

| Method | Endpoint                             | Description      |
| ------ | ------------------------------------ | ---------------- |
| POST   | `/api/cards`                         | Create card      |
| GET    | `/api/cards/:id`                     | Get card details |
| PUT    | `/api/cards/:id`                     | Update card      |
| POST   | `/api/cards/move`                    | Move card        |
| POST   | `/api/cards/:id/members`             | Add member       |
| DELETE | `/api/cards/:id/members/:userId`     | Remove member    |
| POST   | `/api/cards/:id/comments`            | Add comment      |
| DELETE | `/api/cards/:id/comments/:commentId` | Delete comment   |
| DELETE | `/api/cards/:id`                     | Delete card      |

## Deployment

### Frontend (Vercel)

The frontend is configured for Vercel deployment. Set the environment variable:

- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
- `VITE_SOCKET_URL` - Your backend socket URL (e.g., `https://your-backend.onrender.com`)

### Backend (Render)

Deploy the backend to Render as a Web Service. Set environment variables:

- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A strong random secret
- `CLIENT_URL` - Your Vercel frontend URL
- `PORT` - 5000 (or let Render assign)

## License

ISC
