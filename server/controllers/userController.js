import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Department from '../models/Department.js';
import nodemailer from 'nodemailer';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

// Helper to validate and return department name
const validateDepartment = async (deptName) => {
  const validDept = await Department.findOne({ name: deptName });
  return validDept ? validDept.name : null;
};

// @desc    Create Faculty Account (Admin only)
// @route   POST /api/users/faculty
// @access  Private/Admin
// @desc    Create Faculty Account (Admin only)
// @route   POST /api/users/faculty
// @access  Private/Admin
export const createFaculty = async (req, res, next) => {
  try {
    const { 
      name, firstName, lastName, email, department, contactNumber, employeeId, password,
      designation, gender, dob, profilePhoto, status
    } = req.body;

    const deptName = await validateDepartment(department);
    if (!deptName) return res.status(400).json({ success: false, message: 'Invalid department.' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const empId = employeeId || `FAC-${Date.now().toString().slice(-6)}`;
    if (employeeId) {
      const employeeIdExists = await User.findOne({ employeeId });
      if (employeeIdExists) return res.status(400).json({ success: false, message: 'Employee ID already registered' });
    }

    const fullName = name || [firstName, lastName].filter(Boolean).join(' ');

    const faculty = await User.create({
      name: fullName,
      email,
      password,
      role: 'Faculty',
      department: deptName,
      contactNumber,
      employeeId: empId,
      designation: designation || 'Assistant Professor',
      gender: gender || '',
      dob: dob || undefined,
      profilePhoto: profilePhoto || null,
      status: status || 'Active'
    });

    res.status(201).json({ success: true, message: 'Faculty account created successfully.', user: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Student Account (Admin only)
// @route   POST /api/users/student
// @access  Private/Admin
export const createStudent = async (req, res, next) => {
  try {
    const { 
      name, firstName, lastName, email, department, contactNumber, enrollmentNumber, password,
      gender, dob, profilePhoto, status
    } = req.body;

    const deptName = await validateDepartment(department);
    if (!deptName) return res.status(400).json({ success: false, message: 'Invalid department.' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email already registered' });

    if (enrollmentNumber) {
      const enrollmentExists = await User.findOne({ enrollmentNumber });
      if (enrollmentExists) return res.status(400).json({ success: false, message: 'Enrollment number already registered' });
    }

    const fullName = name || [firstName, lastName].filter(Boolean).join(' ');

    const student = await User.create({
      name: fullName,
      email,
      password,
      role: 'Student',
      department: deptName,
      contactNumber,
      enrollmentNumber,
      gender: gender || '',
      dob: dob || undefined,
      profilePhoto: profilePhoto || null,
      status: status || 'Active'
    });

    res.status(201).json({ success: true, message: 'Student account created successfully.', user: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Admin Account (Admin only)
// @route   POST /api/users/admin
// @access  Private/Admin
export const createAdmin = async (req, res, next) => {
  try {
    const { 
      name, firstName, lastName, email, department, contactNumber, employeeId, password,
      designation, gender, dob, profilePhoto, status
    } = req.body;

    const deptName = await validateDepartment(department);
    if (!deptName) return res.status(400).json({ success: false, message: 'Invalid department.' });

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const empId = employeeId || `ADM-${Date.now().toString().slice(-6)}`;
    const fullName = name || [firstName, lastName].filter(Boolean).join(' ');

    const admin = await User.create({
      name: fullName,
      email,
      password,
      role: 'Admin',
      department: deptName,
      contactNumber,
      employeeId: empId,
      designation: designation || 'Administrator',
      gender: gender || '',
      dob: dob || undefined,
      profilePhoto: profilePhoto || null,
      status: status || 'Active'
    });

    res.status(201).json({ success: true, message: 'Admin account created successfully.', user: admin });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Any User (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    
    // Validate department if provided
    if (updates.department) {
      const deptName = await validateDepartment(updates.department);
      if (!deptName) return res.status(400).json({ success: false, message: 'Invalid department.' });
      updates.department = deptName;
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check email uniqueness if email is changed
    if (updates.email && updates.email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: updates.email.toLowerCase().trim() });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use by another user' });
      user.email = updates.email.toLowerCase().trim();
    }

    // Check enrollmentNumber uniqueness if changed
    if (updates.enrollmentNumber && updates.enrollmentNumber !== user.enrollmentNumber) {
      const enrollExists = await User.findOne({ enrollmentNumber: updates.enrollmentNumber });
      if (enrollExists) return res.status(400).json({ success: false, message: 'Enrollment number already in use' });
      user.enrollmentNumber = updates.enrollmentNumber;
    }

    // Password modification
    if (updates.password && updates.password.trim()) {
      user.password = updates.password;
    }

    // Apply allowed fields
    const allowedFields = ['name', 'firstName', 'lastName', 'department', 'contactNumber', 'enrollmentNumber', 'employeeId', 'designation', 'gender', 'dob', 'profilePhoto', 'status'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();
    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage User Status
export const manageUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Suspended', 'Blocked'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status type' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'Admin') return res.status(403).json({ success: false, message: 'Cannot block administrator accounts' });

    user.status = status;
    await user.save();

    res.status(200).json({ success: true, message: `User account status has been updated to ${status}.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete User Account
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'Admin') return res.status(403).json({ success: false, message: 'Cannot delete administrator accounts' });

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User account has been deleted permanently.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get User By ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Users List
export const getUsersList = async (req, res, next) => {
  try {
    const { role, search, department, sort, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (department && department !== 'All Departments') query.department = department;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 }; 
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).lean();
    const totalCount = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users for autocomplete
export const searchUsers = async (req, res, next) => {
  try {
    const { q, role, limit = 20 } = req.query;
    if (!q || q.trim() === '') return res.status(200).json({ success: true, users: [] });

    const query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { enrollmentNumber: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } }
      ]
    };
    if (role) query.role = role;

    const users = await User.find(query).select('-password').limit(parseInt(limit)).lean();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Action on Users
export const bulkUserActions = async (req, res, next) => {
  try {
    const { userIds, action, value } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ success: false, message: 'No users selected' });

    let targetUsers = await User.find({ _id: { $in: userIds } });
    if (['Deactivate', 'Delete'].includes(action)) targetUsers = targetUsers.filter(u => u.role !== 'Admin');
    const targetIds = targetUsers.map(u => u._id);

    if (targetIds.length === 0) return res.status(400).json({ success: false, message: 'No valid users for action.' });

    switch (action) {
      case 'Activate': await User.updateMany({ _id: { $in: targetIds } }, { status: 'Active' }); break;
      case 'Deactivate': await User.updateMany({ _id: { $in: targetIds } }, { status: 'Blocked' }); break;
      case 'Delete': 
        await Registration.deleteMany({ student: { $in: targetIds } });
        await User.deleteMany({ _id: { $in: targetIds } }); 
        break;
      case 'Change Department':
        const deptName = await validateDepartment(value);
        if (!deptName) return res.status(400).json({ success: false, message: 'Invalid department' });
        await User.updateMany({ _id: { $in: targetIds } }, { department: deptName });
        break;
      default: return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.status(200).json({ success: true, message: `Bulk ${action} applied.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Users - Auto download full data without filters
// @route   GET /api/users/export
// @access  Private/Admin
export const exportUsers = async (req, res, next) => {
  try {
    // Requirements: One click download, export complete data, no filters, automatically download, support Excel/CSV
    // Defaulting to Excel since it was requested
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort({ role: 1, createdAt: -1 }).lean();

    const data = users.map(u => ({
      Role: u.role,
      'First Name': u.firstName || '',
      'Middle Name': u.middleName || '',
      'Last Name': u.lastName || '',
      Name: u.name || '',
      Email: u.email,
      Department: u.department,
      Status: u.status,
      Identifier: u.enrollmentNumber || u.employeeId || 'N/A',
      Contact: u.contactNumber || '',
      Gender: u.gender || '',
      DOB: u.dob ? new Date(u.dob).toLocaleDateString() : '',
      Address: u.address || '',
      City: u.city || '',
      State: u.state || '',
      Pincode: u.pincode || '',
      Semester: u.semester || '',
      Division: u.division || '',
      'Guardian Name': u.guardianName || '',
      'Guardian Mobile': u.guardianMobile || '',
      Designation: u.designation || '',
      Qualification: u.qualification || '',
      Experience: u.experience || '',
      Specialization: u.specialization || '',
      Notes: u.notes || ''
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      sheet.columns = headers.map(header => ({ header, key: header, width: 20 }));
      sheet.addRows(data);
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    const roleStr = role ? `${role}s` : 'Users';
    const filename = `EventHuB_${roleStr}_${dateStr}.xlsx`;
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(filename);
    
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    next(error);
  }
};
