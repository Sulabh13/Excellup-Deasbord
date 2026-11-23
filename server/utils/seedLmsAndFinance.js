const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const OnlineCourse = require('../models/OnlineCourse');
const CourseCategory = require('../models/CourseCategory');
const CourseModule = require('../models/CourseModule');
const VideoLecture = require('../models/VideoLecture');
const Assignment = require('../models/Assignment');
const FeeStructure = require('../models/FeeStructure');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const Expense = require('../models/Expense');
const IncomeTransaction = require('../models/IncomeTransaction');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas...');

  const admin = await User.findOne({ role: 'admin' });
  const teacher = await User.findOne({ role: 'teacher' });
  const students = await User.find({ role: 'student' });
  const offlineCourses = await Course.find();
  const batches = await Batch.find();

  if (!admin || !teacher) {
    console.log('Admin or Teacher not found in DB. Run main seed first.');
    process.exit(1);
  }

  console.log(`Found admin: ${admin.email}, teacher: ${teacher.email}, students: ${students.length}`);

  // 1. Seed Course Categories
  const categoriesData = [
    { name: 'Web Development', description: 'Full-stack web applications, frontend & backend frameworks', icon: 'Code' },
    { name: 'Programming Languages', description: 'C, C++, Java, Python core programming foundations', icon: 'Terminal' },
    { name: 'Data Science & AI', description: 'Data Analytics, Machine Learning & Python for Data Science', icon: 'Database' },
    { name: 'Computer Applications', description: 'Tally Prime with GST, Basic to Advanced computer skills', icon: 'Cpu' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    let doc = await CourseCategory.findOne({ name: cat.name });
    if (!doc) {
      doc = await CourseCategory.create(cat);
    }
    categories.push(doc);
  }
  console.log('Course categories ready:', categories.length);

  // 2. Seed Online Courses
  const studentIds = students.map((s) => s._id);

  let mernOnline = await OnlineCourse.findOne({ title: 'Mastering MERN Stack Development 2026' });
  if (!mernOnline) {
    mernOnline = await OnlineCourse.create({
      title: 'Mastering MERN Stack Development 2026',
      description: 'Comprehensive hands-on training covering React 19, Node.js, Express, MongoDB Atlas, Tailwind CSS, and REST API development.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
      category: categories[0]._id,
      categoryName: categories[0].name,
      level: 'Intermediate',
      teacher: teacher._id,
      duration: '40 hours',
      price: 9000,
      courseType: 'Paid',
      status: 'published',
      enrolledStudents: studentIds,
      assignedBatches: batches.map((b) => b._id),
    });

    // Modules & Lectures for MERN
    const mod1 = await CourseModule.create({
      course: mernOnline._id,
      title: 'Module 1: Modern React 19 Fundamentals',
      description: 'Components, Hooks, State Management & Tailwind CSS styling',
      order: 1,
    });

    const mod2 = await CourseModule.create({
      course: mernOnline._id,
      title: 'Module 2: Node.js & Express REST APIs',
      description: 'Express server architecture, Middleware, JWT auth & MongoDB Atlas integration',
      order: 2,
    });

    await VideoLecture.create([
      {
        course: mernOnline._id,
        module: mod1._id,
        title: 'Introduction to React 19 & Project Architecture',
        description: 'Setting up Vite, React 19, Tailwind CSS and modern folder structure.',
        videoType: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk', // High quality React intro
        duration: '22 mins',
        durationMinutes: 22,
        order: 1,
      },
      {
        course: mernOnline._id,
        module: mod1._id,
        title: 'Mastering React State & Effect Hooks',
        description: 'Deep dive into useState, useEffect, useCallback, and custom hooks.',
        videoType: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
        duration: '35 mins',
        durationMinutes: 35,
        order: 2,
      },
      {
        course: mernOnline._id,
        module: mod2._id,
        title: 'Node.js & Express Architecture Deep Dive',
        description: 'Building secure RESTful backend APIs with Express, Helmet, CORS and rate-limiting.',
        videoType: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
        duration: '45 mins',
        durationMinutes: 45,
        order: 3,
      },
    ]);

    // Assignment for MERN
    await Assignment.create({
      course: mernOnline._id,
      teacher: teacher._id,
      title: 'Build a Full-Stack Product Listing with Filter & Search',
      instructions: 'Create a responsive React page with search, category filtering, and link it with an Express GET endpoint.',
      maxMarks: 50,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  }

  let pythonOnline = await OnlineCourse.findOne({ title: 'Complete Python Programming: Zero to Hero' });
  if (!pythonOnline) {
    pythonOnline = await OnlineCourse.create({
      title: 'Complete Python Programming: Zero to Hero',
      description: 'Master core Python, data structures, object-oriented programming, and file handling.',
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
      category: categories[1]._id,
      categoryName: categories[1].name,
      level: 'Beginner',
      teacher: teacher._id,
      duration: '25 hours',
      price: 3500,
      courseType: 'Paid',
      status: 'published',
      enrolledStudents: studentIds.slice(0, 3),
    });

    const pyMod1 = await CourseModule.create({
      course: pythonOnline._id,
      title: 'Module 1: Python Basics & Syntax',
      description: 'Variables, loops, conditionals, and functions in Python',
      order: 1,
    });

    await VideoLecture.create({
      course: pythonOnline._id,
      module: pyMod1._id,
      title: 'Python Installation & Writing Your First Script',
      description: 'Introduction to Python interpreter, VS Code setup, and syntax basics.',
      videoType: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
      duration: '30 mins',
      durationMinutes: 30,
      order: 1,
    });
  }
  console.log('Online courses seeded.');

  // 3. Seed Fee Structures for offline courses
  for (const c of offlineCourses) {
    let defaultFee = c.fees || 5000;
    if (c.code === 'MERN-201') defaultFee = 9000;
    else if (c.code === 'PY-101') defaultFee = 3500;
    else if (c.code === 'C-101' || c.code === 'CPP-101') defaultFee = 3000;
    else if (c.code === 'DS-301') defaultFee = 10000;
    else if (c.code === 'DA-201') defaultFee = 8000;
    else if (c.code === 'BAC-101') defaultFee = 2500;
    else if (c.code === 'TALLY-101') defaultFee = 4500;

    await FeeStructure.findOneAndUpdate(
      { course: c._id },
      {
        course: c._id,
        courseName: c.name,
        totalFees: defaultFee,
        admissionFee: 500,
        registrationFee: 200,
        installmentOptions: 3,
        discountPolicy: '5% upfront payment discount or merit scholarship',
        notes: 'Includes course study notes, practice materials, and test series.',
      },
      { upsert: true }
    );
  }
  console.log('Fee structures ready.');

  // 4. Seed StudentFee records & FeePayment records for existing students
  if (students.length > 0 && offlineCourses.length > 0) {
    const defaultCourse = offlineCourses[0];
    const defaultBatch = batches.length > 0 ? batches[0]._id : null;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const assignedCourse = offlineCourses[i % offlineCourses.length];
      const feeStruct = await FeeStructure.findOne({ course: assignedCourse._id });
      const totalCourseFees = feeStruct ? feeStruct.totalFees : 6000;
      const discount = i === 0 ? 1000 : 0;
      const finalPayable = totalCourseFees - discount;

      // Realistic payment scenario:
      // student 0: fully paid
      // student 1: partially paid (1 installment)
      // student 2: pending
      // student 3: overdue
      let amountPaid = 0;
      let status = 'Pending';
      if (i === 0) {
        amountPaid = finalPayable;
        status = 'Paid';
      } else if (i === 1) {
        amountPaid = Math.round(finalPayable / 2);
        status = 'Partially Paid';
      } else if (i === 2) {
        amountPaid = 0;
        status = 'Pending';
      } else {
        amountPaid = Math.round(finalPayable / 3);
        status = 'Overdue';
      }

      const remainingBalance = finalPayable - amountPaid;
      const dueDate = new Date();
      if (status === 'Overdue') {
        dueDate.setDate(dueDate.getDate() - 10); // 10 days ago
      } else {
        dueDate.setDate(dueDate.getDate() + 20); // 20 days later
      }

      const instSchedule = [
        {
          installmentNo: 1,
          amount: Math.round(finalPayable / 2),
          dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          status: amountPaid >= Math.round(finalPayable / 2) ? 'Paid' : 'Overdue',
          paidDate: amountPaid >= Math.round(finalPayable / 2) ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null,
        },
        {
          installmentNo: 2,
          amount: finalPayable - Math.round(finalPayable / 2),
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          status: amountPaid >= finalPayable ? 'Paid' : 'Pending',
          paidDate: amountPaid >= finalPayable ? new Date() : null,
        },
      ];

      const studentFee = await StudentFee.findOneAndUpdate(
        { student: student._id },
        {
          student: student._id,
          course: assignedCourse._id,
          batch: defaultBatch,
          totalCourseFees,
          discount,
          finalPayable,
          amountPaid,
          remainingBalance,
          dueDate,
          paymentStatus: status,
          installmentSchedule: instSchedule,
          remarks: 'Admission batch 2026',
        },
        { upsert: true, new: true }
      );

      // Create FeePayment record if amountPaid > 0
      if (amountPaid > 0) {
        const receiptNo = `EXC-REC-2026-000${i + 1}`;
        const existingPayment = await FeePayment.findOne({ receiptNumber: receiptNo });
        if (!existingPayment) {
          const payment = await FeePayment.create({
            receiptNumber: receiptNo,
            student: student._id,
            studentFee: studentFee._id,
            course: assignedCourse._id,
            batch: defaultBatch,
            amountPaid,
            previousPaid: 0,
            remainingBalance,
            paymentDate: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000),
            paymentMode: i % 2 === 0 ? 'UPI' : 'Cash',
            transactionId: i % 2 === 0 ? `UPI2026998877${i}` : '',
            installmentNo: 1,
            notes: 'First installment payment recorded at institute office',
            collectedBy: admin._id,
          });

          await IncomeTransaction.create({
            transactionId: receiptNo,
            source: 'Student Course Fees',
            amount: amountPaid,
            date: payment.paymentDate,
            paymentMode: payment.paymentMode,
            referenceId: payment._id,
            student: student._id,
            description: `Course fee payment receipt: ${receiptNo}`,
            recordedBy: admin._id,
          }).catch(() => {});
        }
      }
    }
  }
  console.log('Student fees and payments seeded.');

  // 5. Seed Coaching Expenses
  const sampleExpenses = [
    {
      title: 'Classroom & Computer Lab Rent - November 2026',
      category: 'Rent',
      amount: 15000,
      expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paymentMode: 'Bank Transfer',
      paidTo: 'Building Owner, Main Road, Balaghat',
      description: 'Monthly coaching center premises rent for November 2026',
    },
    {
      title: 'High-speed Fiber Internet Connection (Monthly Plan)',
      category: 'Internet Bill',
      amount: 1200,
      expenseDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      paymentMode: 'UPI',
      paidTo: 'Jio Fiber Balaghat',
      description: '200 Mbps unlimited optical fiber internet connection for computer lab',
    },
    {
      title: 'Electricity Bill for Air Conditioner & Computer Lab',
      category: 'Electricity Bill',
      amount: 4200,
      expenseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      paymentMode: 'UPI',
      paidTo: 'MPPKVVCL Balaghat',
      description: 'Commercial electricity bill payment',
    },
    {
      title: 'Classroom Whiteboard Markers & A4 Printing Paper',
      category: 'Stationery',
      amount: 850,
      expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentMode: 'Cash',
      paidTo: 'Gupta Book Depot, Balaghat',
      description: '5 marker packs, duster, 3 rims of A4 paper for student test sheets',
    },
    {
      title: 'Social Media & Local Banner Marketing Campaign',
      category: 'Marketing & Advertising',
      amount: 3500,
      expenseDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      paymentMode: 'UPI',
      paidTo: 'Local Printing & Instagram Ads',
      description: 'New batch admission banners around Balaghat college area',
    },
    {
      title: 'Teacher Faculty Honorarium Advance',
      category: 'Teacher Salary',
      amount: 12000,
      expenseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paymentMode: 'Bank Transfer',
      paidTo: teacher.name,
      description: 'Monthly faculty salary payout',
    },
  ];

  for (const exp of sampleExpenses) {
    const existing = await Expense.findOne({ title: exp.title });
    if (!existing) {
      await Expense.create({
        ...exp,
        addedBy: admin._id,
      });
    }
  }
  console.log('Coaching expenses seeded.');

  console.log('\n✅ ALL LMS AND FINANCE DATA SUCCESSFULLY SEEDED!\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
