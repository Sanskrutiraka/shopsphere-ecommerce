# 🛍️ ShopSphere — Next-Gen AI-Powered E-Commerce Platform

[![Hackathon Project](https://img.shields.io/badge/Hackathon-Sinhgad%20Institute%20of%20Management-orange.svg?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-blue.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Backend-Django%205.1%20%7C%20DRF-green.svg?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791.svg?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

> 🏆 **Project Recognition**  
> **ShopSphere** was designed, architected, and built during the **Hackathon at Sinhgad Institute of Management**.

---

## 🌟 Overview

**ShopSphere** is a modern, full-stack, enterprise-grade e-commerce platform blending a high-performance **React 19** frontend with a robust **Django REST Framework** backend. Equipped with an **AI Shopping Assistant (Google Gemini)**, secure **Razorpay** payment processing, **Cloudinary** media storage, and real-time inventory and pricing management, ShopSphere delivers a seamless shopping and store-management experience.

---

## ✨ Key Features

### 🛒 Customer Experience
- **Interactive Product Catalog**: Instant multi-attribute search, category filtering, price sliders, sorting, and pagination.
- **Smart Cart & Wishlist**: Persistent cart and wishlist with stock checks.
- **Razorpay Checkout**: Seamless online payments with automated verification and order confirmation.
- **Order Tracking & History**: Real-time status lifecycle (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED`).
- **AI Shopping Assistant**: Powered by Google Gemini to recommend products, answer store queries, and assist buyers 24/7.
- **Secure Authentication**: JWT-based authentication with OTP email verification.

### ⚡ Admin & Merchant Control Center
- **Executive Analytics Dashboard**: Revenue trends, sales breakdowns, top-selling products, and order status charts.
- **Inventory & Stock Management**: Real-time stock alerts, low-stock threshold monitoring, and bulk adjustments.
- **Dynamic Pricing Engine**: Automated and manual discount scheduling with margin protection.
- **Audit Logs & Security**: Comprehensive audit trails for logins, order updates, stock alterations, and administrative actions.
- **Exportable Reports**: Generate instant PDF and Excel exports for sales, revenue, and inventory audits.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, React Router v7 |
| **Backend** | Python 3.11+, Django 5.1, Django REST Framework, SimpleJWT |
| **Database** | PostgreSQL (Neon.tech) / SQLite for local development |
| **AI / ML** | Google Gemini API (`google-generativeai`) |
| **Payments** | Razorpay Gateway Integration |
| **Media & Storage** | Cloudinary Storage CDN |
| **Security** | CORS Headers, Password Hashing, JWT Tokens, Protected Environment Configs |

---

## 📁 Project Architecture

```
ShopSphere/
├── Backend/
│   ├── accounts/             # User authentication, profiles, OTP verification
│   ├── chatbot/              # AI Assistant powered by Google Gemini
│   ├── core/                 # Django project settings, ASGI/WSGI, routing
│   ├── orders/               # Order processing, items, status tracking
│   ├── payments/             # Razorpay payment verification & webhook handling
│   ├── products/             # Categories, product models, inventory & pricing
│   ├── recommendations/      # Product recommendation engine
│   ├── reports/              # PDF & Excel business reporting
│   ├── manage.py             # Django CLI management
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
├── Frontend/
│   ├── public/               # Static assets & favicons
│   ├── src/
│   │   ├── components/       # UI components, layout, chatbot, cards
│   │   ├── contexts/         # React Auth & Cart state providers
│   │   ├── pages/            # Customer, Auth, and Admin views
│   │   └── lib/              # Axios API client & utilities
│   ├── package.json          # Node dependencies & scripts
│   ├── vite.config.js        # Vite configuration
│   └── .env.example          # Frontend environment variables template
├── run_project.bat           # Automated one-click development launcher
├── .gitignore                # Git exclusions (Security & Hygiene)
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** & `pip`
- **Node.js 18+** & `npm`
- **Git**

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/shopsphere.git
cd shopsphere
```

---

### 2️⃣ Backend Setup

```bash
cd Backend

# Create & activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env     # On Windows (or cp .env.example .env on Linux/macOS)

# Apply migrations
python manage.py migrate

# (Optional) Seed sample data
python seed_data.py

# Start Django Development Server
python manage.py runserver
```
> Backend will start running at: `http://127.0.0.1:8000/`

---

### 3️⃣ Frontend Setup

```bash
cd ../Frontend

# Install dependencies
npm install

# Configure environment variables
copy .env.example .env     # On Windows (or cp .env.example .env on Linux/macOS)

# Start Vite Development Server
npm run dev
```
> Frontend will start running at: `http://localhost:5173/`

---

### ⚡ One-Click Run (Windows)
You can also launch both Backend and Frontend servers concurrently by double-clicking:
```bat
run_project.bat
```

---

## 🔐 Environment Configuration

### Backend (`Backend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `SECRET_KEY` | Django Secret Key | `django-insecure-...` |
| `DEBUG` | Enable Debug Mode | `True` |
| `ALLOWED_HOSTS` | Allowed HTTP hosts | `localhost,127.0.0.1` |
| `DATABASE_URL` | Neon PostgreSQL connection string | `sqlite:///db.sqlite3` |
| `GEMINI_API_KEY` | Google Gemini AI Key | `AIzaSy...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `secret...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_secret` |
| `EMAIL_HOST_USER` | SMTP Username for OTPs | `your_email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | App Password for Gmail SMTP | `your_app_password` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |

### Frontend (`Frontend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API endpoint | `http://127.0.0.1:8000/api` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key for checkout | `rzp_test_...` |

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@shopsphere.com` | `admin123` |
| **Customer** | `user@shopsphere.com` | `User@123` |
| **Customer** | Register a new account with email verification | Any password |

---

## 🛡️ Security & Privacy Notice
- All real credentials, API secrets, tokens, and database files are protected via `.gitignore`.
- Always generate unique, secret keys when deploying to production.

---

## 👥 Acknowledgments & Hackathon Credits
- Developed during the **Hackathon at Sinhgad Institute of Management**.
- Special thanks to the mentors, organizers, and peers at Sinhgad Institute of Management.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
