const User = require('../models/userModel');
const catchAsyn = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsyn(async (req, res, next) => {
  // 1. Create error if User POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `This route is not for passowrd update, please use /updateMyPassword.`,
        400
      )
    );
  }

  // 2. Filtered out unwanted fields names that are not allow to be updated
  // cannot allow body.role: 'admin
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3. If not, simply update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  console.log(updatedUser);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsyn(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not defined yet! Please use Signup instead.',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// do NOT ypdate passwords with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
