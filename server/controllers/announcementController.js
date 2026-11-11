const Announcement = require('../models/Announcement');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc  Get all announcements (filtered by role/batch)
// @route GET /api/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'student') {
      filter.$or = [
        { targetRole: 'all' },
        { targetRole: 'student' },
      ];
    } else if (req.user.role === 'teacher') {
      filter.$or = [{ targetRole: 'all' }, { targetRole: 'teacher' }];
    }
    // Exclude expired
    filter.$or = filter.$or
      ? filter.$or
      : [];
    const now = new Date();
    const announcements = await Announcement.find({
      ...filter,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate('createdBy', 'name role')
      .populate('batch', 'name')
      .sort('-createdAt');
    successResponse(res, announcements, 'Announcements fetched');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Get single announcement
// @route GET /api/announcements/:id
exports.getAnnouncementById = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id).populate('createdBy', 'name').populate('batch', 'name');
    if (!ann) return errorResponse(res, 'Announcement not found', 404);
    successResponse(res, ann);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Create announcement
// @route POST /api/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, createdBy: req.user._id });
    successResponse(res, ann, 'Announcement created', 201);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Update announcement
// @route PUT /api/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ann) return errorResponse(res, 'Announcement not found', 404);
    successResponse(res, ann, 'Announcement updated');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Delete announcement
// @route DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return errorResponse(res, 'Announcement not found', 404);
    successResponse(res, null, 'Announcement deleted');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

