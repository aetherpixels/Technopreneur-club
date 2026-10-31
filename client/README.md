# Event-HuB Client (Frontend)

The frontend application for **Event-HuB – Institutional Activity Management System**, built with React 19, Vite, Tailwind CSS, and Lucide Icons.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form + Zod
- **API Client**: Axios
- **File & Certificate Processing**: JSZip, XLSX

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env
```

Ensure `VITE_API_URL` points to your backend instance:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: **`http://localhost:5173`**

### 4. Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Directory Structure

```text
client/
├── public/                 # Static public assets (icons, favicon, logo)
├── src/
│   ├── assets/             # Images and design media
│   ├── components/         # Reusable UI components (Modals, Navbar, Sidebar, etc.)
│   ├── config/             # Axios and API configuration
│   ├── context/            # AuthContext and Global State
│   ├── layouts/            # Dashboard and Public layouts
│   ├── pages/
│   │   ├── admin/          # Admin dashboards and user management
│   │   ├── faculty/        # Event creation, attendance, certificate management
│   │   ├── student/        # Event browsing, registrations, certificates
│   │   └── auth/           # Login, Forgot Password, Profile
│   ├── utils/              # Helper utilities
│   ├── App.jsx             # Route definitions
│   └── main.jsx            # Application entrypoint
├── index.html              # HTML template
├── package.json            # Project dependencies and scripts
├── vercel.json             # Vercel SPA routing configuration
└── vite.config.js          # Vite build configuration
```
