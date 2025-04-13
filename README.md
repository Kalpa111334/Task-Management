# Task Management System

A full-stack task management system built with React, TypeScript, and Node.js.

## Features

- User Authentication (Admin/Employee)
- Real-time Task Management
- File Upload for Task Proof
- Chat Functionality
- Performance Analytics
- Mobile Responsive Design
- Dark Mode Support

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Quick Start

1. Install all dependencies (both frontend and backend):
```bash
npm run install:all
```

2. Start both servers (frontend and backend) with a single command:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Available Scripts

- `npm start` - Runs both frontend and backend servers
- `npm run dev` - Runs only the frontend server
- `npm run start:backend` - Runs only the backend server
- `npm run build:all` - Builds both frontend and backend
- `npm run install:all` - Installs dependencies for both frontend and backend

## Default Ports

- Frontend: 5173 (Vite dev server)
- Backend: 3000 (Express server)

## Project Structure

```
task-management/
├── src/                  # Frontend source files
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── contexts/        # React contexts
│   └── types/           # TypeScript types
├── backend/             # Backend source files
│   ├── src/             # Backend source code
│   ├── uploads/         # File uploads directory
│   └── data/            # JSON data storage
└── package.json         # Project configuration
```

## Environment Setup

The project uses default configuration for development. For production, you should set up appropriate environment variables.

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed:
```bash
npm run install:all
```

2. Clear node_modules and reinstall:
```bash
rm -rf node_modules backend/node_modules
npm run install:all
```

3. Check if ports 5173 and 3000 are available

## License

MIT 