# User Management API

## Project Description

This is a basic REST API for learning backend development with Node.js, Express.js, MongoDB, and Mongoose. It demonstrates user authentication, account approval, simple user administration, and profile management.

## Features

- User and admin signup
- Password hashing
- Login with JWT
- Pending, approved, and rejected user statuses
- Admin approval system
- Admin user management
- User profile management
- Password change
- Protected routes
- Role-based authorization
- Request validation
- Central error handling

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- helmet
- cors
- nodemon

## Folder Structure

```text
user-management-api/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/
│   │   └── createAdmin.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Installation

1. Clone or open the project folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` using `.env.example` as a template. For example, copy the file and replace the placeholders with your local settings.
4. Start local MongoDB or set `MONGO_URI` to a MongoDB Atlas connection string.
5. Create the first approved admin:

   ```bash
   npm run create-admin
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

## Environment Variables

Set these variables in your local `.env` file:

- `NODE_ENV`: Runtime mode, such as `development` or `production`.
- `PORT`: Port used by the Express server.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret used to sign and verify JWTs. Keep it private.
- `ADMIN_NAME`: Name for the first admin account.
- `ADMIN_EMAIL`: Email for the first admin account.
- `ADMIN_PASSWORD`: Password for the first admin account. Use a strong password and keep it private.

Do not put real credentials in `.env.example`.

## First Admin Setup

Signup creates accounts with `pending` approval status, including accounts requesting the admin role. The `create-admin` script is provided to bootstrap the first approved admin account.

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`, make sure MongoDB is available, then run:

```bash
npm run create-admin
```

The script will create an approved admin unless an account with that email already exists. The admin can then log in and manage approvals.

## API Base URL

```text
http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Health check |
| POST | `/api/auth/signup` | Public | Create a pending user or admin account |
| POST | `/api/auth/login` | Public | Log in an approved account |
| GET | `/api/admin/pending-users` | Approved admin | List pending accounts |
| GET | `/api/admin/users` | Approved admin | List users, optionally filtered by `approvalStatus` |
| GET | `/api/admin/users/:id` | Approved admin | Get a user by ID |
| PATCH | `/api/admin/users/:id/approval` | Approved admin | Approve or reject a user |
| DELETE | `/api/admin/users/:id` | Approved admin | Delete another user |
| GET | `/api/users/profile` | Approved user | Get the logged-in user's profile |
| PATCH | `/api/users/profile` | Approved user | Update the logged-in user's name or email |
| PATCH | `/api/users/profile/password` | Approved user | Change the logged-in user's password |

“Approved user” includes an approved admin accessing their own profile.

## Authentication

For protected routes, include the JWT returned by login in the request header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Admin routes require an approved admin token. Profile routes accept any approved user's token.

## Approval Flow

1. A user signs up and receives `pending` status.
2. An approved admin logs in.
3. The admin views pending users.
4. The admin approves or rejects the user.
5. Only approved users can log in and access protected routes.

## Testing with Postman

Use `http://localhost:5000` as the base URL.

1. Create the first admin with `npm run create-admin`.
2. Log in as that admin using `POST /api/auth/login`; save the returned token.
3. Create a normal account using `POST /api/auth/signup`.
4. View pending users using `GET /api/admin/pending-users` with the admin token.
5. Approve the account using `PATCH /api/admin/users/USER_ID/approval`.
6. Log in as the approved user and save that token.
7. Test `GET /api/users/profile` and `PATCH /api/users/profile`.
8. Change the password using `PATCH /api/users/profile/password`, then log in with the new password.
9. Test admin user listing, filtering, lookup, and deletion endpoints.

Example request bodies:

**Signup — `POST /api/auth/signup`**

```json
{
  "name": "Sample User",
  "email": "user@example.com",
  "password": "YOUR_PASSWORD",
  "role": "user"
}
```

**Login — `POST /api/auth/login`**

```json
{
  "email": "user@example.com",
  "password": "YOUR_PASSWORD"
}
```

**Approval update — `PATCH /api/admin/users/USER_ID/approval`**

```json
{
  "approvalStatus": "approved"
}
```

**Profile update — `PATCH /api/users/profile`**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Password change — `PATCH /api/users/profile/password`**

```json
{
  "currentPassword": "CURRENT_PASSWORD",
  "newPassword": "NEW_PASSWORD"
}
```

## Final Postman Test Checklist

### Public route tests

- [ ] Health route works.
- [ ] Signup validation works.
- [ ] Duplicate email is rejected.
- [ ] Pending user cannot log in.
- [ ] Incorrect password is rejected.

### Admin tests

- [ ] Approved admin can log in.
- [ ] Normal user cannot access admin routes.
- [ ] Admin can see pending users.
- [ ] Admin can approve and reject users.
- [ ] Admin cannot change their own approval status.
- [ ] Admin can get all users.
- [ ] Admin can filter users by `approvalStatus`.
- [ ] Admin can get a user by ID.
- [ ] Invalid user ID returns status `400`.
- [ ] Missing user returns status `404`.
- [ ] Admin cannot delete their own account.
- [ ] Admin can delete another user.

### Profile tests

- [ ] Missing token returns status `401`.
- [ ] Invalid token returns status `401`.
- [ ] Pending or rejected user cannot access protected routes.
- [ ] Approved user can view their profile.
- [ ] Approved user can update name and email.
- [ ] User cannot update role or approval status.
- [ ] Duplicate email update is rejected.
- [ ] Incorrect current password is rejected.
- [ ] Password can be changed.
- [ ] Old password stops working.
- [ ] New password works.

### Error tests

- [ ] Unknown route returns a JSON 404 response.
- [ ] Error responses use `success: false`.
- [ ] Production errors do not expose stack traces.

## HTTP Status Codes

- `200 OK`: Request completed successfully.
- `201 Created`: Account created successfully.
- `400 Bad Request`: Invalid input or request values.
- `401 Unauthorized`: Missing or invalid authentication, or incorrect credentials.
- `403 Forbidden`: Account is not approved or the user lacks admin access.
- `404 Not Found`: Requested user or route does not exist.
- `500 Internal Server Error`: Unexpected server error.

## Security Notes

- Passwords are hashed before storage.
- Passwords are not returned in API responses.
- Keep the JWT secret and database URI in `.env`.
- Never commit `.env`.
- Restrict allowed CORS origins in production.
- Use strong admin credentials.
- Use HTTPS in production.

## Learning Project Limitations

This project intentionally does not include:

- Email verification
- Forgot-password email flow
- Refresh tokens
- Rate limiting
- Pagination
- Search
- Automated tests
- File uploads
- Production deployment configuration
