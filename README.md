# Transportes App

A full ride-hailing MVP (like Uber/Cabify) built with Node.js, Express, PostgreSQL, React, and Vite.

## Features

- User registration and login (passengers and drivers) with JWT authentication
- Request a ride with origin, destination, and distance
- Automatic price calculation (base fare + per km rate)
- Email confirmation sent upon ride request (HTML email via Nodemailer)
- Ride history for passengers; all rides visible to drivers
- Clean, responsive UI built with Tailwind CSS

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Backend    | Node.js, Express 4, PostgreSQL, JWT |
| Frontend   | React 18, Vite, Tailwind CSS       |
| Email      | Nodemailer (SMTP)                  |
| Auth       | bcrypt + JSON Web Tokens           |

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

---

## Setup Instructions

### 1. Clone and navigate

```bash
cd C:\Users\sergi\transportes-app
```

### 2. Set up PostgreSQL database

Open `psql` or your PostgreSQL client and run:

```sql
CREATE DATABASE transportes_db;
```

The tables are created automatically when the server starts (via `db.js`), or you can run manually:

```bash
psql -U your_user -d transportes_db -f backend/schema.sql
```

### 3. Configure the backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3001
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/transportes_db
JWT_SECRET=a_long_random_secret_string_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_gmail@gmail.com
```

> **Gmail App Password**: Go to Google Account > Security > 2-Step Verification > App passwords. Generate one for "Mail".

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the App

### Start the backend (Terminal 1)

```bash
cd backend
npm run dev
```

The API will be available at: `http://localhost:3001`

### Start the frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The app will open at: `http://localhost:5173`

---

## API Endpoints

### Auth

| Method | Endpoint              | Description                        | Auth Required |
|--------|-----------------------|------------------------------------|---------------|
| POST   | `/api/auth/register`  | Register a new user                | No            |
| POST   | `/api/auth/login`     | Login and receive JWT              | No            |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "passenger"
}
```

**Login body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

### Rides

| Method | Endpoint                          | Description                          | Auth Required |
|--------|-----------------------------------|--------------------------------------|---------------|
| POST   | `/api/rides`                      | Request a new ride (passenger only)  | Yes           |
| GET    | `/api/rides`                      | Get rides (own for passenger, all for driver) | Yes  |
| GET    | `/api/rides/:id`                  | Get a specific ride                  | Yes           |
| GET    | `/api/rides/calculate/price`      | Calculate price for a distance       | Yes           |

**Create ride body:**
```json
{
  "origin": "123 Main St, New York",
  "destination": "JFK Airport, Queens",
  "distance_km": 25.5,
  "passenger_email": "john@example.com"
}
```

**Calculate price query:**
```
GET /api/rides/calculate/price?distance_km=15
```

---

## Price Formula

```
price = $2.50 + (distance_km × $1.20)
```

Example: 10 km trip = $2.50 + (10 × $1.20) = **$14.50**

---

## Project Structure

```
transportes-app/
  backend/
    package.json
    .env.example
    schema.sql               # SQL schema (auto-applied on start)
    src/
      index.js               # Express server entry point
      db.js                  # PostgreSQL pool + schema init
      routes/
        auth.js              # POST /register, POST /login
        rides.js             # POST /rides, GET /rides, GET /rides/:id
      middleware/
        auth.js              # JWT verification + role guard
      services/
        email.js             # Nodemailer HTML email
        price.js             # Price calculation logic
  frontend/
    package.json
    vite.config.js
    tailwind.config.js
    index.html
    src/
      main.jsx               # React entry point
      App.jsx                # Root component with routing
      index.css              # Tailwind + custom utilities
      api.js                 # Axios instance + auth/rides API calls
      components/
        Login.jsx            # Login form
        Register.jsx         # Registration form with role selector
        RequestRide.jsx      # Ride request form with live price preview
        RideHistory.jsx      # Ride list with stats and filters
```

---

## Environment Variables

| Variable       | Description                                    | Example                          |
|----------------|------------------------------------------------|----------------------------------|
| `PORT`         | Backend server port                            | `3001`                           |
| `DATABASE_URL` | PostgreSQL connection string                   | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET`   | Secret for signing JWTs (keep this secure!)    | `my_super_secret_key_123`        |
| `EMAIL_HOST`   | SMTP host                                      | `smtp.gmail.com`                 |
| `EMAIL_PORT`   | SMTP port                                      | `587`                            |
| `EMAIL_USER`   | SMTP username                                  | `you@gmail.com`                  |
| `EMAIL_PASS`   | SMTP password or app password                  | `abcd efgh ijkl mnop`            |
| `EMAIL_FROM`   | Sender address shown in emails                 | `you@gmail.com`                  |

---

## Notes

- The frontend uses `localStorage` to store the JWT token
- Email sending is non-blocking — a ride is still created if the email fails
- Drivers can see all rides in the system; passengers only see their own
- The schema is auto-initialized on backend startup via `db.js`
