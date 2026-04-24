const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const users = [
            {
                name: 'Super Admin',
                email: 'admin@example.com',
                password: 'password123',
                role: 'superadmin',
            },
            {
                name: 'John Teacher',
                email: 'teacher@example.com',
                password: 'password123',
                role: 'teacher',
            },
            {
                name: 'Jane Student',
                email: 'student@example.com',
                password: 'password123',
                role: 'student',
                rollNumber: '101'
            },
        ];

        // Password hashing is handled in the User model pre-save middleware
        // We can just create them directly

        // However, User.insertMany DOES NOT trigger pre('save') middleware!
        // We must loop and save one by one or manually hash if using insertMany.
        // Let's loop.

        for (const user of users) {
            await User.create(user);
        }

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
