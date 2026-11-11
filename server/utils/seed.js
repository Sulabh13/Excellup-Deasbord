const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const MCQTest = require('../models/MCQTest');
const Question = require('../models/Question');
const Announcement = require('../models/Announcement');
const StudyMaterial = require('../models/StudyMaterial');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/excellup';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), StudentProfile.deleteMany({}), TeacherProfile.deleteMany({}),
    Course.deleteMany({}), Subject.deleteMany({}), Batch.deleteMany({}),
    Enrollment.deleteMany({}), Attendance.deleteMany({}),
    MCQTest.deleteMany({}), Question.deleteMany({}),
    Announcement.deleteMany({}), StudyMaterial.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Admin ────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin Excellup',
    email: 'admin@excellup.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });
  console.log('👤 Admin created:', admin.email);

  // ── Teachers ─────────────────────────────────────────
  const teacherHash = await bcrypt.hash('Teacher@123', 12);
  const [t1, t2] = await User.insertMany([
    { name: 'Rahul Sharma', email: 'teacher@excellup.com', password: teacherHash, role: 'teacher', isActive: true },
    { name: 'Priya Verma', email: 'teacher2@excellup.com', password: teacherHash, role: 'teacher', isActive: true },
  ]);

  // ── Courses ──────────────────────────────────────────
  const [cse, fullstack] = await Course.insertMany([
    { name: 'Computer Science Fundamentals', code: 'CSF-101', description: 'Core CS concepts', duration: '12 months', fees: 15000, isActive: true },
    { name: 'Full Stack Web Development', code: 'FSD-201', description: 'MERN Stack development', duration: '6 months', fees: 20000, isActive: true },
  ]);

  // ── Subjects ─────────────────────────────────────────
  const [math, python, react, node] = await Subject.insertMany([
    { name: 'Mathematics', code: 'MATH-101', course: cse._id, description: 'Discrete mathematics', isActive: true },
    { name: 'Python Programming', code: 'PY-101', course: cse._id, description: 'Python basics to advanced', isActive: true },
    { name: 'React.js', code: 'REACT-201', course: fullstack._id, description: 'Frontend with React', isActive: true },
    { name: 'Node.js & Express', code: 'NODE-201', course: fullstack._id, description: 'Backend with Node.js', isActive: true },
  ]);

  // ── Batches ──────────────────────────────────────────
  const [batch1, batch2] = await Batch.insertMany([
    {
      name: 'CSF Morning Batch', batchCode: 'CSF-M-2024',
      course: cse._id, subject: math._id, teacher: t1._id,
      schedule: 'Mon-Fri, 8:00 AM - 10:00 AM',
      startDate: new Date('2024-01-15'), endDate: new Date('2024-12-31'),
      maxStudents: 30, isActive: true,
    },
    {
      name: 'FSD Evening Batch', batchCode: 'FSD-E-2024',
      course: fullstack._id, subject: react._id, teacher: t2._id,
      schedule: 'Mon-Sat, 6:00 PM - 8:00 PM',
      startDate: new Date('2024-03-01'), endDate: new Date('2024-08-31'),
      maxStudents: 25, isActive: true,
    },
  ]);

  // Update TeacherProfiles
  await TeacherProfile.insertMany([
    { user: t1._id, phone: '9876543210', qualification: 'B.Tech CS', experience: 5, assignedBatches: [batch1._id], subjects: [math._id, python._id], joiningDate: new Date('2023-01-01'), status: 'active' },
    { user: t2._id, phone: '9876543211', qualification: 'MCA', experience: 3, assignedBatches: [batch2._id], subjects: [react._id, node._id], joiningDate: new Date('2023-06-01'), status: 'active' },
  ]);
  console.log('👩‍🏫 Teachers created');

  // ── Students ─────────────────────────────────────────
  const studentData = [
    { name: 'Aarav Joshi', email: 'student@excellup.com', studentId: 'EXC-2024-001', batch: batch1._id, course: cse._id },
    { name: 'Sneha Patel', email: 'student2@excellup.com', studentId: 'EXC-2024-002', batch: batch1._id, course: cse._id },
    { name: 'Rohit Kumar', email: 'student3@excellup.com', studentId: 'EXC-2024-003', batch: batch2._id, course: fullstack._id },
    { name: 'Ananya Singh', email: 'student4@excellup.com', studentId: 'EXC-2024-004', batch: batch2._id, course: fullstack._id },
    { name: 'Vikram Das', email: 'student5@excellup.com', studentId: 'EXC-2024-005', batch: batch1._id, course: cse._id },
  ];

  for (const s of studentData) {
    const user = await User.create({ name: s.name, email: s.email, password: 'Student@123', role: 'student', studentId: s.studentId, isActive: true });
    await StudentProfile.create({
      user: user._id, studentId: s.studentId, course: s.course, batch: s.batch,
      phone: '98765432' + Math.floor(Math.random() * 10),
      enrollmentDate: new Date('2024-01-15'), status: 'active',
    });
    await Enrollment.create({ student: user._id, batch: s.batch, enrollmentDate: new Date('2024-01-15'), status: 'active' });
  }
  console.log('🎓 Students created');

  // ── Sample Attendance ─────────────────────────────────
  const students = await User.find({ role: 'student' });
  const statusList = ['present', 'present', 'present', 'absent', 'late'];
  const today = new Date();
  for (let d = 0; d < 10; d++) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const stu of students) {
      const profile = await StudentProfile.findOne({ user: stu._id });
      if (!profile) continue;
      await Attendance.create({
        student: stu._id, batch: profile.batch, date,
        status: statusList[Math.floor(Math.random() * statusList.length)],
        markedBy: t1._id,
      });
    }
  }
  console.log('📅 Attendance records created');

  // ── Sample MCQ Test ───────────────────────────────────
  const now = new Date();
  const testStart = new Date(now); testStart.setHours(0, 0, 0, 0);
  const testEnd = new Date(now); testEnd.setDate(now.getDate() + 7); testEnd.setHours(23, 59, 59, 999);

  const test = await MCQTest.create({
    title: 'Python Basics Quiz - Week 1',
    description: 'Test covering Python fundamentals including variables, loops, and functions.',
    subject: python._id, batch: batch1._id, createdBy: t1._id,
    totalQuestions: 5, duration: 30, totalMarks: 10,
    passingPercentage: 60, negativeMarking: false,
    startTime: testStart, endTime: testEnd,
    instructions: '1. Each question carries 2 marks.\n2. No negative marking.\n3. Submit before the timer ends.',
    status: 'active', isResultPublished: false,
    shuffleQuestions: true, shuffleOptions: false,
  });

  const questions = [
    { questionText: 'Which of the following is used to define a function in Python?', options: [{ text: 'function', isCorrect: false }, { text: 'def', isCorrect: true }, { text: 'func', isCorrect: false }, { text: 'define', isCorrect: false }], explanation: 'In Python, the "def" keyword is used to define a function.', marks: 2, order: 1 },
    { questionText: 'What is the output of print(type(42))?', options: [{ text: "<class 'int'>", isCorrect: true }, { text: "<class 'str'>", isCorrect: false }, { text: "<class 'float'>", isCorrect: false }, { text: "<class 'number'>", isCorrect: false }], explanation: '42 is an integer, so type() returns <class "int">.', marks: 2, order: 2 },
    { questionText: 'Which data structure uses key-value pairs in Python?', options: [{ text: 'List', isCorrect: false }, { text: 'Tuple', isCorrect: false }, { text: 'Dictionary', isCorrect: true }, { text: 'Set', isCorrect: false }], explanation: 'Dictionaries in Python store data as key-value pairs.', marks: 2, order: 3 },
    { questionText: 'What does the len() function return?', options: [{ text: 'The last element of a sequence', isCorrect: false }, { text: 'The sum of all elements', isCorrect: false }, { text: 'The number of items in an object', isCorrect: true }, { text: 'The largest element', isCorrect: false }], explanation: 'len() returns the number of items in a sequence or collection.', marks: 2, order: 4 },
    { questionText: 'Which keyword is used to handle exceptions in Python?', options: [{ text: 'catch', isCorrect: false }, { text: 'except', isCorrect: true }, { text: 'handle', isCorrect: false }, { text: 'error', isCorrect: false }], explanation: 'Python uses "except" to handle exceptions in a try-except block.', marks: 2, order: 5 },
  ];

  for (const q of questions) {
    await Question.create({ ...q, test: test._id });
  }
  console.log('📝 MCQ Test and questions created');

  // ── Announcements ─────────────────────────────────────
  await Announcement.insertMany([
    { title: 'Welcome to Excellup!', content: 'Welcome to Excellup Coding Classes. We are excited to have you on board. Please check your schedules and study materials regularly.', createdBy: admin._id, targetRole: 'all', priority: 'high', isActive: true },
    { title: 'Holiday Notice', content: 'Classes will be suspended on November 15th for Diwali celebrations. Happy Diwali to all students and teachers!', createdBy: admin._id, targetRole: 'all', priority: 'medium', isActive: true, expiresAt: new Date('2024-11-20') },
    { title: 'Python Quiz Scheduled', content: 'A Python Basics quiz has been scheduled for Batch CSF Morning. Please prepare chapters 1-5. The test is live now!', createdBy: t1._id, targetRole: 'student', priority: 'high', isActive: true },
  ]);
  console.log('📢 Announcements created');

  // ── Study Material (sample) ───────────────────────────
  await StudyMaterial.create({
    title: 'Python Basics - Chapter 1 Notes',
    description: 'Introduction to Python, installation, variables, data types',
    subject: python._id, batch: batch1._id, uploadedBy: t1._id,
    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
    fileType: 'pdf', fileName: 'python-ch1.pdf', fileSize: 1024000,
    topic: 'Python Basics', chapter: 'Chapter 1', tags: ['python', 'basics', 'variables'],
    isActive: true,
  });
  console.log('📚 Study material created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Default Credentials:');
  console.log('  Admin   : admin@excellup.com / Admin@123');
  console.log('  Teacher1: teacher1@excellup.com / Teacher@123');
  console.log('  Teacher2: teacher2@excellup.com / Teacher@123');
  console.log('  Student : student1@excellup.com / Student@123');
  console.log('  (StudentIds: EXC-2024-001 to EXC-2024-005)\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });

