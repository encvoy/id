### 1. Project Description

Backend that processes authorization requests from the widget, interacts with the main Encvoy ID backend, OIDC, and returns user data.

### 2. Project Structure

auth/
├── src/
│ ├── middleware/
│ │ └── errorHandler.ts # Middleware for error handling
│ ├── routes/
│ │ └── auth.ts # Logic for interaction with the backend
│ └── main.ts # Application entry point
├── .env # Environment variables
├── package.json # Dependencies and scripts
└── README.md # Documentation
