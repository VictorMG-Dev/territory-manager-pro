# Territory Manager Pro

A modern PWA (Progressive Web App) for managing territories and congregations, built with React, Vite, and Supabase.

## Features
- 🗺️ **Territory Management**: Create, assign, and track territories with map integration.
- 👥 **Congregation Support**: Manage publishers, elders, and service groups.
- 📱 **Mobile First**: Fully responsive design that works great on phones and tablets.
- 🔒 **Secure Authentication**: Robust login and registration system.

## Prerequisites
- Node.js (v18 or higher)
- A Supabase project

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    cd server && npm install && cd ..
    ```

2.  **Environment Configuration**
    - Copy `.env.example` to `.env` in the `server` directory.
    - Fill in your Supabase credentials in `server/.env`.

3.  **Run the Project**
    This command starts both the frontend and the backend server concurrently.
    ```bash
    npm run dev
    ```

    - Frontend: http://localhost:3000
    - Backend: http://localhost:3002

## Project Structure
- `/pages` - React page components
- `/components` - Reusable UI components
- `/server` - Express.js backend and API
- `/services` - API client services
