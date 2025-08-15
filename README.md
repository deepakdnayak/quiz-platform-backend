# Quiz Platform Backend

This is the backend for the **Quiz Platform**, built with **Node.js**, **Express**, and **MongoDB**. It handles authentication, quiz management, user progress tracking, and scoring.

## Features

- **User Authentication**: Secure login and registration for Admins, Instructors, and Students.
- **Role Management**: Different permissions for each user role.
- **Quiz Management**: Add, edit, and delete quizzes with multiple-choice questions.
- **Progress Tracking**: Stores and updates user quiz attempts and scores.
- **MongoDB Integration**: Stores all platform data securely.

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Token)
- **Environment Variables**: Managed using `.env`

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project folder:
   ```bash
   cd quiz-platform-backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with the required variables:
   ```env
   PORT=5000
   MONGODB_URI=<your_mongo_uri>
   JWT_SECRET=<your_secret_key>
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Contribution

Feel free to submit issues and pull requests to improve the backend.