# LMS Grave - Production Deployment Guide

This repository contains the frontend React client and the backend Express/Node.js server for LMS Grave.
Follow this guide to get it running on your local machine or deploy it to a fresh production server (like an Ubuntu VPS).

## 1. Local Initialization (Development)

First, clone the repository to your system:
```bash
git clone https://github.com/yourusername/lmsgrave.git
cd lmsgrave
```

### Install Dependencies
You need to install dependencies for both the client and the server.
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### Environment Variables
You need to setup environment variables for both directories.

**Server (`server/.env`)**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/lmsgrave
JWT_SECRET=your_super_secret_key
```

**Client (`client/.env`)**
```env
VITE_API_URL=http://localhost:5000
VITE_SERVER_URL=http://localhost:5000
```

### 2. Seeding the Empty MongoDB Database
Because MongoDB starts completely empty on a new system, you should seed the database with initial Users (Super Admin, Teacher, Student) so you can login and test the platform.

Inside the `server` directory, run:
```bash
npm run seed
```
This automatically inserts the following default credentials into your database:
- **Admin**: admin@example.com / password123
- **Teacher**: teacher@example.com / password123
- **Student**: student@example.com / password123

### 3. Production Deployment (Nginx & PM2)

If you are running this on a live production server, you should securely host the API and Frontend using **Nginx** and **PM2**.

#### A. Build the Frontend
Inside the `client` directory, you must configure your `.env.production` file so its variables map dynamically for Nginx:
```env
VITE_API_URL=/api
VITE_SERVER_URL=
```
Then, generate the static bundle:
```bash
npm run build
```
This creates a `dist` folder natively recognized by Nginx.

#### B. Start Backend with PM2
Install PM2 globally if you haven't already:
```bash
npm install -g pm2
```
Navigate to the `server` folder, then boot up the API in the background:
```bash
pm2 start server.js --name lms-api
pm2 save
pm2 startup
```

#### C. Configure Nginx
We provide an `nginx.conf` template in the root directory. 
1. Open `nginx.conf` and replace the `/var/www/lmsgrave` paths with the **absolute path** to where you cloned this repository.
2. Copy this file to your Nginx sites configuration:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/lmsgrave
sudo ln -s /etc/nginx/sites-available/lmsgrave /etc/nginx/sites-enabled/
```
3. Test your Nginx configuration and reload it gracefully:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Your LMS Web App should now be running cleanly with Nginx natively serving your frontend and your uploaded static assets, while robustly proxying API requests directly to the Node backend!
# LMSGRAVE
