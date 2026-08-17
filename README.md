# Qaza Platform - Backend API

## Overview
The core backend service for the Qaza charity donation platform. This RESTful API is built utilizing a robust Node.js and Express architecture, strongly typed with TypeScript, and uses Prisma ORM for reliable MongoDB database interactions. 

## Technology Stack
* Runtime: Node.js
* Framework: Express.js
* Language: TypeScript
* ORM: Prisma
* Database: MongoDB (Atlas)
* Authentication: JWT (JSON Web Tokens)
* Email Service: Nodemailer

## Project Structure
```text
/
├── prisma/             # Prisma schema and database migrations
├── src/
│   ├── controllers/    # Request handlers and business logic routing
│   ├── middlewares/    # Custom Express middlewares (Auth, Validation, Rate Limiting)
│   ├── routes/         # Express route definitions
│   ├── services/       # Core business logic and database interactions
│   ├── utils/          # Helper functions and utilities
│   └── index.ts        # Application entry point and server setup
├── .env.example        # Environment variables template
└── tsconfig.json       # TypeScript configuration
----
```

Core API Contracts & Integration Notes
Authentication Flow: The system uses a JWT-based access mechanism. The client must pass the accessToken via the Authorization: Bearer <token> header. Refresh tokens are handled via HttpOnly cookies.

OTP Verification: The endpoint POST /auth/verify-email strictly requires a payload containing both { email, otp }.

File Uploads: Image uploads must be transmitted as multipart/form-data with the specific field key image (Max file size: 5MB).

Withdrawal Requests: The endpoint POST /wallets/me/withdraw strictly requires a payload of { amount }.

Environment Setup
Create a .env file in the root directory and configure the following variables:

مقتطف الرمز
PORT=5000
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/qaza"
JWT_SECRET="your_secure_jwt_secret"
SMTP_HOST="your_smtp_host"
SMTP_PORT="your_smtp_port"
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"
Installation & Execution
Bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database push (if schema changed)
npx prisma db push

# Start development server
npm run dev
