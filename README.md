# TaskBoard

TaskBoard is a lightweight personal task manager that allows users to securely manage their daily tasks with authentication and persistent sessions, built using React, Express.js, and Supabase PostgreSQL.

## Features

- **Authentication**: Secure login using Google OAuth or email/password.
- **Task Management**: Create, view, update, and delete tasks.
- **Task Status**: Track tasks as `Pending`, `In Progress`, or `Completed`.
- **Email Notifications**: Get notified when a task is created or its status changes.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Supabase account for the database.

### Setup

1.  **Clone the repository** (or copy the client and server folders if separate).

    ```bash
    git clone <repository-url>
    cd TaskBoard
    ```

2.  **Server Setup**:
    - Navigate to the server directory:
      ```bash
      cd server
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the `server/` directory with the following variables (see `.env.example`):
      ```env
      PORT=5000
      DATABASE_URL="your_supabase_connection_string"
      JWT_SECRET=your_secret_key
      JWT_EXPIRES_IN=7d
      FRONTEND_URL=http://localhost:5173
      # Add other OAuth and email variables as needed
      ```
    - Run the server:
      ```bash
      npm start
      ```

3.  **Client Setup**:
    - Navigate to the client directory:
      ```bash
      cd client
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the `client/` directory:
      ```env
      VITE_API_URL=http://localhost:5000/api
      ```
    - Run the client:
      ```bash
      npm run dev
      ```

4.  **Access the App**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- Use **Google Login** for a quick and secure sign-in.
- Use **Email/Password** for traditional registration.
- Once logged in, navigate to your **Dashboard** to manage tasks.
- **Sign Out** when you're done.
