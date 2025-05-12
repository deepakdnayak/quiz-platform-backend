# Quiz Platform API Documentation

## Introduction

The Quiz Platform API enables a web application to manage users, quizzes, quiz attempts, and platform statistics. It supports three user roles: **Student**, **Instructor**, and **Admin**. This documentation is designed for frontend developers to understand how to interact with the API, including authentication, data flow, and endpoint usage.

- **Base URL**: `http://localhost:5000` (update to production URL as needed).
- **Authentication**: Most endpoints require a JWT token in the `Authorization` header.
- **Content Type**: All requests and responses use `application/json`.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are obtained via the Auth endpoints and must be included in the `Authorization` header for protected routes.

### How to Authenticate

1. **Register** a user (`POST /api/auth/register`).
2. **Log in** to get a JWT token (`POST /api/auth/login`).
3. Include the token in requests: `Authorization: Bearer <token>`.

## Information Flow

The API supports distinct workflows for each user role. Below is how data flows between the frontend and backend:

- **Student**:

  1. Register and log in to get a JWT token.
  2. Create a profile with details like `yearOfStudy`.
  3. List assigned quizzes based on `yearOfStudy`.
  4. View quiz details and submit attempts.
  5. Check results after the quiz ends.
  6. View dashboard with completed quizzes and scores.

- **Instructor**:

  1. Register (pending approval) and log in.
  2. Wait for Admin approval.
  3. Create, update, or delete quizzes.
  4. View quiz statistics and dashboard with quiz performance.

- **Admin**:

  1. Log in (pre-created in database).
  2. Approve or reject Instructor accounts.
  3. Manage user roles or delete users.
  4. View student progress and platform-wide statistics.

**Diagram** (for visualization in frontend docs):

```
[Frontend] --> Register/Login --> [Backend: Auth] --> JWT Token
[Student] --> Create Profile --> [Backend: Users] --> Profile Data
[Student] --> List Quizzes --> [Backend: Quizzes] --> Quiz List
[Student] --> Submit Attempt --> [Backend: Quizzes] --> Attempt Result
[Instructor] --> Create Quiz --> [Backend: Quizzes] --> Quiz ID
[Instructor] --> View Stats --> [Backend: Quizzes] --> Quiz Statistics
[Admin] --> Approve Instructor --> [Backend: Admin] --> Updated User
```

## Endpoints

Below are the 21 API endpoints, grouped by module. Each includes details for frontend integration.

### Auth Endpoints

#### 1. Register User

- **Method**: `POST`

- **Path**: `/api/auth/register`

- **Description**: Creates a new user (Student or Instructor). Instructors require Admin approval.

- **Headers**:

  ```http
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "email": "student@example.com",
    "password": "password123",
    "role": "Student"
  }
  ```

- **Response**:

  - **Success (201 Created)**:

    ```json
    {
      "userId": "671234567890123456789012",
      "email": "student@example.com",
      "role": "Student"
    }
    ```

  - **Error (400 Bad Request)**:

    ```json
    { "error": "Email already exists", "status": 400 }
    ```

- **Prerequisites**: None (public endpoint).

- **Notes**: Use `role: "Student"` or `role: "Instructor"`. Admin role not allowed.

#### 2. Login User

- **Method**: `POST`

- **Path**: `/api/auth/login`

- **Description**: Authenticates a user and returns a JWT token.

- **Headers**:

  ```http
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "email": "student@example.com",
    "password": "password123"
  }
  ```

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "671234567890123456789012",
        "email": "student@example.com",
        "role": "Student"
      }
    }
    ```

  - **Error (401 Unauthorized)**:

    ```json
    { "error": "Invalid credentials", "status": 401 }
    ```

- **Prerequisites**: User must be registered.

- **Notes**: Store the `token` in local storage or cookies for subsequent requests.

### User Endpoints

#### 3. Get User Profile

- **Method**: `GET`

- **Path**: `/api/users/profile`

- **Description**: Retrieves the authenticated user’s profile details.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "user": {
        "id": "671234567890123456789012",
        "email": "student@example.com",
        "role": "Student"
      },
      "profile": {
        "_id": "671234567890123456789014",
        "userId": "671234567890123456789012",
        "firstName": "John",
        "lastName": "Doe",
        "yearOfStudy": 1,
        "department": "Computer Science",
        "rollNumber": "CS001"
      }
    }
    ```

  - **Error (401 Unauthorized)**:

    ```json
    { "error": "No token provided", "status": 401 }
    ```

- **Prerequisites**: User must be logged in (Student or Instructor).

- **Notes**: Profile may be `null` for Instructors or new Students.

#### 4. Update User Profile

- **Method**: `PUT`

- **Path**: `/api/users/profile`

- **Description**: Creates or updates the user’s profile (mainly for Students).

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "yearOfStudy": 1,
    "department": "Computer Science",
    "rollNumber": "CS001"
  }
  ```

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "profile": {
        "_id": "671234567890123456789014",
        "userId": "671234567890123456789012",
        "firstName": "John",
        "lastName": "Doe",
        "yearOfStudy": 1,
        "department": "Computer Science",
        "rollNumber": "CS001"
      }
    }
    ```

  - **Error (400 Bad Request)**:

    ```json
    { "error": "Roll number already exists", "status": 400 }
    ```

- **Prerequisites**: User must be logged in (Student).

- **Notes**: Call after login to set up Student profile. Required for quiz access.

### Quiz Endpoints

#### 5. Get Assigned Quizzes

- **Method**: `GET`

- **Path**: `/api/quizzes?status=active`

- **Description**: Lists quizzes assigned to the Student’s `yearOfStudy`.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Query Params**:

  - `status`: `active`, `upcoming`, or `past` (optional, defaults to all).

- **Response**:

  - **Success (200 OK)**:

    ```json
    [
      {
        "_id": "671234567890123456789015",
        "title": "Sample Quiz",
        "description": "Test quiz for year 1",
        "yearOfStudy": 1,
        "startTime": "2025-05-12T12:00:00Z",
        "endTime": "2025-05-12T14:00:00Z",
        "duration": 60
      }
    ]
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Not authorized", "status": 403 }
    ```

- **Prerequisites**: Student must have a profile with `yearOfStudy`.

- **Notes**: Use `status` to filter quizzes. Display active quizzes in a dashboard.

#### 6. Create Quiz

- **Method**: `POST`

- **Path**: `/api/quizzes`

- **Description**: Creates a new quiz (Instructor only).

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "title": "Math Quiz",
    "description": "Math quiz for year 1",
    "yearOfStudy": 1,
    "startTime": "2025-05-13T10:00:00Z",
    "endTime": "2025-05-13T12:00:00Z",
    "duration": 90,
    "questions": [
      {
        "text": "What is 3+3?",
        "options": [
          { "text": "5", "isCorrect": false },
          { "text": "6", "isCorrect": true },
          { "text": "7", "isCorrect": false }
        ],
        "score": 15
      }
    ]
  }
  ```

- **Response**:

  - **Success (201 Created)**:

    ```json
    {
      "quizId": "671234567890123456789017",
      "title": "Math Quiz",
      "yearOfStudy": 1,
      "startTime": "2025-05-13T10:00:00Z",
      "endTime": "2025-05-13T12:00:00Z"
    }
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Instructor not approved", "status": 403 }
    ```

- **Prerequisites**: Instructor must be approved.

- **Notes**: Validate `startTime` &lt; `endTime` before sending.

#### 7. Update Quiz

- **Method**: `PUT`

- **Path**: `/api/quizzes/:quizId`

- **Description**: Updates an existing quiz (Instructor only).

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "title": "Updated Math Quiz",
    "description": "Updated math quiz",
    "yearOfStudy": 1,
    "startTime": "2025-05-13T10:00:00Z",
    "endTime": "2025-05-13T12:00:00Z",
    "duration": 90,
    "questions": [
      {
        "text": "What is 3+3?",
        "options": [
          { "text": "5", "isCorrect": false },
          { "text": "6", "isCorrect": true },
          { "text": "7", "isCorrect": false }
        ],
        "score": 15
      }
    ]
  }
  ```

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "quizId": "671234567890123456789017",
      "title": "Updated Math Quiz",
      "yearOfStudy": 1,
      "startTime": "2025-05-13T10:00:00Z",
      "endTime": "2025-05-13T12:00:00Z"
    }
    ```

  - **Error (400 Bad Request)**:

    ```json
    { "error": "Cannot update started quiz", "status": 400 }
    ```

- **Prerequisites**: Quiz must exist, not started, and created by the Instructor.

- **Notes**: Disable edit button if quiz has started.

#### 8. Delete Quiz

- **Method**: `DELETE`

- **Path**: `/api/quizzes/:quizId`

- **Description**: Deletes a quiz (Instructor only).

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    { "message": "Quiz deleted" }
    ```

  - **Error (404 Not Found)**:

    ```json
    { "error": "Quiz not found", "status": 404 }
    ```

- **Prerequisites**: Quiz must exist, not started, and created by the Instructor.

- **Notes**: Confirm deletion in UI to avoid accidental deletes.

#### 9. Get Quiz Details

- **Method**: `GET`

- **Path**: `/api/quizzes/:quizId`

- **Description**: Retrieves quiz details for taking the quiz (Student only).

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "quizId": "671234567890123456789015",
      "title": "Sample Quiz",
      "duration": 60,
      "questions": [
        {
          "questionId": "abc123",
          "text": "What is 2+2?",
          "options": [
            { "optionId": "opt1", "text": "3" },
            { "optionId": "opt2", "text": "4" },
            { "optionId": "opt3", "text": "5" }
          ]
        }
      ]
    }
    ```

  - **Error (400 Bad Request)**:

    ```json
    { "error": "Quiz not active", "status": 400 }
    ```

- **Prerequisites**: Quiz must be active and match Student’s `yearOfStudy`.

- **Notes**: Use `duration` to implement a timer in the frontend.

#### 10. Submit Quiz Attempt

- **Method**: `POST`

- **Path**: `/api/quizzes/:quizId/attempt`

- **Description**: Submits a Student’s quiz answers.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "answers": [
      {
        "questionId": "abc123",
        "selectedOptionIds": ["opt2"]
      },
      {
        "questionId": "def456",
        "selectedOptionIds": ["opt4", "opt6"]
      }
    ]
  }
  ```

- **Response**:

  - **Success (201 Created)**:

    ```json
    {
      "attemptId": "671234567890123456789018",
      "quizId": "671234567890123456789015",
      "totalScore": 30,
      "isScored": true
    }
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Quiz already attempted", "status": 403 }
    ```

- **Prerequisites**: Quiz must be active, and Student must not have attempted it.

- **Notes**: Disable submit button after one attempt. Validate answers client-side.

#### 11. Get Quiz Results

- **Method**: `GET`

- **Path**: `/api/quizzes/:quizId/results`

- **Description**: Retrieves a Student’s quiz results after the quiz ends.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "attempt": {
        "attemptId": "671234567890123456789018",
        "quizId": "671234567890123456789015",
        "totalScore": 30,
        "answers": [
          {
            "questionId": "abc123",
            "selectedOptionIds": ["opt2"],
            "isCorrect": true,
            "scoreAwarded": 10
          }
        ]
      },
      "quiz": {
        "questions": [
          {
            "questionId": "abc123",
            "text": "What is 2+2?",
            "options": [
              { "optionId": "opt1", "text": "3", "isCorrect": false },
              { "optionId": "opt2", "text": "4", "isCorrect": true }
            ],
            "correctOptionIds": ["opt2"],
            "score": 10
          }
        ]
      }
    }
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Quiz still active", "status": 403 }
    ```

- **Prerequisites**: Quiz must have ended, and Student must have attempted it.

- **Notes**: Poll for results only after `endTime`.

#### 12. Get Quiz Statistics

- **Method**: `GET`

- **Path**: `/api/quizzes/:quizId/statistics`

- **Description**: Retrieves statistics for a quiz (Instructor only).

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "_id": "671234567890123456789019",
      "quizId": "671234567890123456789015",
      "totalAttempts": 1,
      "averageScore": 30,
      "highestScore": 30,
      "lowestScore": 30,
      "attemptsByYear": [
        { "yearOfStudy": 1, "count": 1 }
      ],
      "lastUpdated": "2025-05-12T10:05:00Z"
    }
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Not authorized", "status": 403 }
    ```

- **Prerequisites**: Quiz must exist and be created by the Instructor.

- **Notes**: Stats update every 5 minutes. Use polling or cache results.

### Student Endpoints

#### 13. Get Student Dashboard

- **Method**: `GET`

- **Path**: `/api/students/dashboard`

- **Description**: Retrieves a Student’s quiz history and stats.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "completedQuizzes": [
        {
          "quizId": "671234567890123456789015",
          "title": "Sample Quiz",
          "totalScore": 30,
          "attemptDate": "2025-05-12T10:05:00Z"
        }
      ],
      "upcomingQuizzes": [],
      "averageScore": 30
    }
    ```

  - **Error (404 Not Found)**:

    ```json
    { "error": "Profile not found", "status": 404 }
    ```

- **Prerequisites**: Student must have a profile.

- **Notes**: Display completed and upcoming quizzes in a dashboard UI.

### Instructor Endpoints

#### 14. Get Instructor Quizzes

- **Method**: `GET`

- **Path**: `/api/instructors/quizzes?status=active`

- **Description**: Lists quizzes created by the Instructor.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Query Params**:

  - `status`: `active`, `upcoming`, or `past` (optional).

- **Response**:

  - **Success (200 OK)**:

    ```json
    [
      {
        "quizId": "671234567890123456789015",
        "title": "Sample Quiz",
        "yearOfStudy": 1,
        "startTime": "2025-05-12T12:00:00Z",
        "endTime": "2025-05-12T14:00:00Z",
        "totalAttempts": 1
      }
    ]
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Not authorized", "status": 403 }
    ```

- **Prerequisites**: Instructor must be approved.

- **Notes**: Use to populate an Instructor’s quiz management page.

#### 15. Get Instructor Dashboard

- **Method**: `GET`

- **Path**: `/api/instructors/dashboard`

- **Description**: Retrieves Instructor’s quiz performance overview.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "totalQuizzes": 1,
      "activeQuizzes": [
        {
          "_id": "671234567890123456789015",
          "title": "Sample Quiz",
          "startTime": "2025-05-12T12:00:00Z",
          "endTime": "2025-05-12T14:00:00Z"
        }
      ],
      "averageAttemptsPerQuiz": 1,
      "averageScoreAcrossQuizzes": 30
    }
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Not authorized", "status": 403 }
    ```

- **Prerequisites**: Instructor must be approved.

- **Notes**: Use for an Instructor’s analytics dashboard.

### Admin Endpoints

#### 16. Get All Users

- **Method**: `GET`

- **Path**: `/api/admin/users?role=Student`

- **Description**: Lists all users, optionally filtered by role.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Query Params**:

  - `role`: `Student`, `Instructor`, or `Admin` (optional).

- **Response**:

  - **Success (200 OK)**:

    ```json
    [
      {
        "_id": "671234567890123456789012",
        "email": "student@example.com",
        "role": "Student",
        "isApproved": null
      }
    ]
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Not authorized", "status": 403 }
    ```

- **Prerequisites**: Admin role required.

- **Notes**: Use to populate an admin user management table.

#### 17. Approve Instructor

- **Method**: `PUT`

- **Path**: `/api/admin/users/:userId/approve`

- **Description**: Approves or rejects an Instructor account.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "isApproved": true
  }
  ```

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "userId": "671234567890123456789013",
      "email": "instructor@example.com",
      "role": "Instructor",
      "isApproved": true
    }
    ```

  - **Error (404 Not Found)**:

    ```json
    { "error": "User not found", "status": 404 }
    ```

- **Prerequisites**: Admin role; user must be an Instructor.

- **Notes**: Toggle approval in admin UI.

#### 18. Change User Role

- **Method**: `PUT`

- **Path**: `/api/admin/users/:userId/role`

- **Description**: Changes a user’s role.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

  ```json
  {
    "role": "Instructor"
  }
  ```

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "userId": "671234567890123456789012",
      "email": "student@example.com",
      "role": "Instructor",
      "isApproved": false
    }
    ```

  - **Error (400 Bad Request)**:

    ```json
    { "error": "Invalid role", "status": 400 }
    ```

- **Prerequisites**: Admin role; user must exist.

- **Notes**: Use sparingly; affects user permissions.

#### 19. Delete User

- **Method**: `DELETE`

- **Path**: `/api/admin/users/:userId`

- **Description**: Deletes a user and their associated data.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    { "message": "User deleted" }
    ```

  - **Error (404 Not Found)**:

    ```json
    { "error": "User not found", "status": 404 }
    ```

- **Prerequisites**: Admin role; user must exist.

- **Notes**: Confirm deletion in UI; cascades to quizzes and attempts.

#### 20. Get Student Progress

- **Method**: `GET`

- **Path**: `/api/admin/students/:userId/progress`

- **Description**: Retrieves a Student’s quiz attempt history.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "student": {
        "userId": "671234567890123456789012",
        "email": "student@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "yearOfStudy": 1
      },
      "attempts": [
        {
          "quizId": "671234567890123456789015",
          "title": "Sample Quiz",
          "totalScore": 30,
          "attemptDate": "2025-05-12T10:05:00Z"
        }
      ],
      "averageScore": 30,
      "totalQuizzesAttempted": 1
    }
    ```

  - **Error (404 Not Found)**:

    ```json
    { "error": "Student not found", "status": 404 }
    ```

- **Prerequisites**: Admin role; user must be a Student.

- **Notes**: Display in admin analytics UI.

#### 21. Get Platform Statistics

- **Method**: `GET`

- **Path**: `/api/admin/statistics`

- **Description**: Retrieves platform-wide quiz and attempt stats.

- **Headers**:

  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**: None

- **Response**:

  - **Success (200 OK)**:

    ```json
    {
      "totalQuizzes": 1,
      "totalAttempts": 1,
      "averageScore": 30,
      "attemptsByYear": [
        { "yearOfStudy": 1, "count": 1 }
      ],
      "activeQuizzes": 1
    }
    ```

  - **Error (403 Forbidden)**:

    ```json
    { "error": "Not authorized", "status": 403 }
    ```

- **Prerequisites**: Admin role.

- **Notes**: Use for platform admin dashboard.

## Error Handling

The API returns standard HTTP error codes with JSON messages:

- **400 Bad Request**: Invalid input (e.g., missing fields, invalid `quizId`).

  ```json
  { "error": "Invalid quiz ID", "status": 400 }
  ```

- **401 Unauthorized**: Missing or invalid JWT token.

  ```json
  { "error": "No token provided", "status": 401 }
  ```

- **403 Forbidden**: User lacks permission (e.g., wrong role, unapproved Instructor).

  ```json
  { "error": "Not authorized", "status": 403 }
  ```

- **404 Not Found**: Resource not found (e.g., quiz, user).

  ```json
  { "error": "Quiz not found", "status": 404 }
  ```

- **500 Internal Server Error**: Server-side issue (rare, log and report).

  ```json
  { "error": "Server error", "status": 500 }
  ```

**Frontend Tip**: Handle errors gracefully with user-friendly messages (e.g., “Quiz not found, please try another.”).

## Example Workflow

### Student Taking a Quiz

1. **Register**:

   ```javascript
   fetch('http://localhost:5000/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'student@example.com',
       password: 'password123',
       role: 'Student'
     })
   }).then(res => res.json());
   ```

2. **Log in**:

   ```javascript
   fetch('http://localhost:5000/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'student@example.com',
       password: 'password123'
     })
   }).then(res => res.json()).then(data => localStorage.setItem('token', data.token));
   ```

3. **Create Profile**:

   ```javascript
   fetch('http://localhost:5000/api/users/profile', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     },
     body: JSON.stringify({
       firstName: 'John',
       lastName: 'Doe',
       yearOfStudy: 1,
       department: 'Computer Science',
       rollNumber: 'CS001'
     })
   }).then(res => res.json());
   ```

4. **List Quizzes**:

   ```javascript
   fetch('http://localhost:5000/api/quizzes?status=active', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
   }).then(res => res.json());
   ```

5. **Submit Quiz Attempt**:

   ```javascript
   fetch('http://localhost:5000/api/quizzes/671234567890123456789015/attempt', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     },
     body:J JSON.stringify({
       answers: [
         { questionId: 'abc123', selectedOptionIds: ['opt2'] }
       ]
     })
   }).then(res => res.json());
   ```

6. **View Results** (after quiz ends):

   ```javascript
   fetch('http://localhost:5000/api/quizzes/671234567890123456789015/results', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
   }).then(res => res.json());
   ```

### Instructor Creating a Quiz

1. **Log in** (after Admin approval).

2. **Create Quiz**:

   ```javascript
   fetch('http://localhost:5000/api/quizzes', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     },
     body: JSON.stringify({
       title: 'Math Quiz',
       description: 'Math quiz for year 1',
       yearOfStudy: 1,
       startTime: '2025-05-13T10:00:00Z',
       endTime: '2025-05-13T12:00:00Z',
       duration: 90,
       questions: [
         {
           text: 'What is 3+3?',
           options: [
             { text: '5', isCorrect: false },
             { text: '6', isCorrect: true },
             { text: '7', isCorrect: false }
           ],
           score: 15
         }
       ]
     })
   }).then(res => res.json());
   ```

3. **View Statistics**:

   ```javascript
   fetch('http://localhost:5000/api/quizzes/671234567890123456789017/statistics', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
   }).then(res => res.json());
   ```

## Tips for Frontend Developers

- **Token Management**: Store JWT tokens securely (e.g., HttpOnly cookies or local storage with XSS protection).

- **Error Handling**: Display user-friendly messages for 400/404 errors; redirect to login on 401.

- **Polling**: For quiz results or statistics, poll after `endTime` or every 5 minutes for stats.

- **Validation**: Validate inputs (e.g., `startTime` &lt; `endTime`) before sending requests.

- **Postman**: Import the Postman collection (TBD) for testing.

- **React Example**:

  ```javascript
  import axios from 'axios';
  const API = axios.create({ baseURL: 'http://localhost:5000' });
  API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  ```

## Contact

For issues or clarifications, contact deepakdnayak2004@gmail.com.