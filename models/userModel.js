const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `A use must have a name`],
  },
  email: {
    type: String,
    required: [true, `A user must have an email`],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, `User should provide a valid Email`],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, `A user must have a password`],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, `Please provide your confirm your password`],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: `Password and PasswordConfirm are not the same`,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only this function if password was actually modified
  if (!this.isModified('password')) return next();
  // hash is asynchronous version, return a Promise
  this.password = await bcrypt.hash(this.password, 12); // hash the password with cost of 12
  this.passwordConfirm = undefined; // does not save in the database
  next();
});

userSchema.pre('save', function (next) {
  // did NOT modify password
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // False mean NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minitues to reset password
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
