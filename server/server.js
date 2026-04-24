const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const visualLearningRoutes = require('./routes/visualLearningRoutes');
const studentLearningRoutes = require('./routes/studentLearningRoutes');
const noteRoutes = require('./routes/noteRoutes');
const imageSortingRoutes = require('./routes/imageSortingRoutes');

app.use('/api/users', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher/courses', visualLearningRoutes);
app.use('/api/student/courses', studentLearningRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/visual', imageSortingRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
