# 🎓 Event-HuB – Institutional Activity Management System

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A comprehensive, role-based full-stack institutional event management platform built for universities, colleges, and academic departments. **Event-HuB** streamlines event publishing, student registrations, attendance tracking, custom certificate generation with QR verification, and media management across departments.

---

## 🌟 Key Features

### 🛡️ Admin Portal
- **User & Department Management**: Manage Faculty, Student, and Admin accounts with full CRUD operations.
- **Bulk Import**: Onboard students and staff via spreadsheet / CSV uploads.
- **Institutional Analytics**: Real-time stats on event engagement, registrations, and attendance metrics across departments.

### 👨‍🏫 Faculty Coordinator Portal
- **Event & Festival Creation**: Create single department workshops or multi-event campus festivals with banners, dates, and eligibility.
- **Live Attendance Tracking**: Mark student attendance seamlessly with real-time status updates (`Present`, `Absent`).
- **Dynamic Certificate Builder**:
  - Configure certificate titles, signatures, institutional logos, and custom templates.
  - Automated PDF certificate generation for attendees with embedded verification QR codes.
- **Event Media & Document Repository**: Upload post-event documents, reports, and photo galleries.

### 🎓 Student Portal
- **Discover Events**: Browse upcoming campus workshops, technical hackathons, cultural festivals, and seminars.
- **Easy Registration**: One-click individual or team registration with automated email confirmations.
- **Digital Certificate Locker**: Instant download of earned, cryptographically verifiable certificates in PDF format.
- **Activity History**: Track attended events and institutional achievements.

---

## 🏗️ Project Architecture

```text
EVENT-HUB/
├── client/                     # Frontend Single Page Application (React + Vite)
│   ├── public/                 # Static branding assets & icons
│   ├── src/                    # Components, Pages, Context, API config
│   ├── .env.example            # Example frontend environment variables
│   ├── package.json            # Client dependencies and scripts
│   ├── vercel.json             # SPA routing rewrite rules for Vercel
│   └── vite.config.js          # Vite configuration
│
├── server/                     # Backend REST API Server (Node.js + Express)
│   ├── assets/fonts/           # Typography fonts for PDF certificate generation
│   ├── config/                 # Database (Mongoose) & Email (Nodemailer) setup
│   ├── controllers/            # Route business logic handlers
│   ├── middleware/             # JWT auth, role validation, file upload handlers
│   ├── models/                 # Mongoose schemas (User, Event, Registration, Certificate, etc.)
│   ├── routes/                 # Express API routes
│   ├── scripts/                # Database seed, migration, and reset utilities
│   ├── templates/              # Responsive HTML email templates
│   ├── uploads/                # Local uploaded media storage (gitignored except .gitkeep)
│   ├── utils/                  # PDFkit generator, QR code engine, email sender
│   ├── .env.example            # Example backend environment variables
│   ├── package.json            # Server dependencies and scripts
│   └── server.js               # Express application entrypoint
│
├── .gitignore                  # Root Git ignore rules (prevents secrets, builds, uploads)
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.x or v20.x recommended)
- **MongoDB** running locally (`mongodb://localhost:27017/event-hub`) or MongoDB Atlas URI

---

### Step 1: Clone or Navigate to the Repository

```bash
git clone https://github.com/<your-username>/EVENT-HUB.git
cd EVENT-HUB
```

---

### Step 2: Configure & Start the Backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` if you need custom MongoDB or SMTP email credentials.*

4. Initialize & Seed Default Accounts:
   ```bash
   npm run reset-db
   ```
   *(Optional)* To populate sample events and festivals:
   ```bash
   npm run seed-events
   ```

5. Launch the backend development server:
   ```bash
   npm run dev
   ```
   Backend runs at **`http://localhost:5000`**.

---

### Step 3: Configure & Start the Frontend

1. Open a new terminal window and navigate to the client:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

4. Launch the frontend development server:
   ```bash
   npm run dev
   ```
   Frontend runs at **`http://localhost:5173`**.

---

## 🔐 Default Login Credentials

Running `npm run reset-db` configures three pre-seeded accounts:

| Role | Name | Email | Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@eventhub.com` | `AdminPassword123!` | Information Technology |
| **Faculty** | Prof. John Doe | `faculty@eventhub.com` | `FacultyPassword123!` | Computer Engineering |
| **Student** | Jane Smith | `student@eventhub.com` | `StudentPassword123!` | Computer Engineering |

---

## ⚙️ Environment Variables Reference

### Backend (`server/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend port number | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/event-hub` |
| `JWT_SECRET` | Secret key for JWT token signing | `your_secret_key` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `EMAIL_HOST` | SMTP server host (e.g., `smtp.gmail.com`) | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username / email address | - |
| `EMAIL_PASS` | SMTP password / Gmail App Password | - |

### Frontend (`client/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend REST API | `http://localhost:5000` |

---

## 🌐 Production Hosting & Deployment Guide

This project is pre-configured for seamless cloud hosting. You can deploy it using either **Option A (Recommended: Vercel + Render + MongoDB Atlas)** or **Option B (All-in-One Fullstack)**.

### 1. Database: MongoDB Atlas (Free Cloud Database)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist all IPs (`0.0.0.0/0`).
3. Copy your connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/event-hub?retryWrites=true&w=majority`).

---

### 2. Backend: Deploy on Render / Railway

#### Deploying on Render (Web Service):
1. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repository.
2. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default, Render supplies `$PORT`)
   - `MONGO_URI`: *Your MongoDB Atlas connection string*
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` *(update after frontend deployment)*
   - `JWT_SECRET`: *A secure random string*
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: *Your Gmail account*
   - `EMAIL_PASS`: *Your 16-character Gmail App Password*
4. Click **Deploy**. Note your backend live URL (e.g., `https://event-hub-api.onrender.com`).

---

### 3. Frontend: Deploy on Vercel

1. Import your GitHub repository on [Vercel](https://vercel.com).
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://event-hub-api.onrender.com` *(your backend live URL)*
4. Click **Deploy**. Vercel will build and assign your live URL.
5. Update `CLIENT_URL` in your backend environment variables with your new Vercel URL.

---

## 📤 How to Push this Project to GitHub

Follow these steps from the root `EVENT-HUB` folder:

```bash
# 1. Initialize a local Git repository
git init

# 2. Stage all project files (unwanted files and secrets are automatically filtered out by .gitignore)
git add .

# 3. Create your initial commit
git commit -m "Initial commit: Event-HuB Institutional Activity Management System"

# 4. Set the default branch to main
git branch -M main

# 5. Connect to your GitHub repository (create a new empty repo on github.com first)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push your project to GitHub
git push -u origin main
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
