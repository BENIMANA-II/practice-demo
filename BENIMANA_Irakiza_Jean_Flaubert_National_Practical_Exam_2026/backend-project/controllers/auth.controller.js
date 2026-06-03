// Handles sign up, sign in, sign out, and the 4-digit password-recovery flow.
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const BCRYPT_ROUNDS = 10;

// Server-side mirrors of the client validation rules (single source of truth for the backend).
const NAME_REGEX = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(078|079|073|072)\d{7}$/;
const RECOVERY_CODE_REGEX = /^\d{4}$/;
const USERNAME_MIN = 3;
const PASSWORD_MIN = 6;

function generateRecoveryCode() {
  // 4-digit code, zero-padded so values like "0042" stay 4 digits.
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

// Strips secret fields before returning a user to the client.
function toPublicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
  };
}

function validateRegistration({ fullName, email, phone, username, password }) {
  const errors = [];
  if (!fullName || !NAME_REGEX.test(fullName.trim())) {
    errors.push('Full name must contain letters only (spaces, hyphens and apostrophes allowed).');
  }
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('A valid email address is required.');
  if (!phone || !PHONE_REGEX.test(phone.trim())) {
    errors.push('Phone must be 10 digits starting with 078, 079, 073 or 072.');
  }
  if (!username || username.trim().length < USERNAME_MIN || /\s/.test(username.trim())) {
    errors.push('Username must be at least 3 characters with no spaces.');
  }
  if (!password || password.length < PASSWORD_MIN) {
    errors.push('Password must be at least 6 characters.');
  }
  return errors;
}

async function register(req, res) {
  try {
    const { fullName, email, phone, username, password } = req.body;
    const errors = validateRegistration({ fullName, email, phone, username, password });
    if (errors.length > 0) return res.status(400).json({ error: errors[0] });

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existing = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }, { phone: normalizedPhone }],
    });
    if (existing) {
      return res.status(400).json({ error: 'Username, email or phone is already in use.' });
    }

    const recoveryCode = generateRecoveryCode();
    const [passwordHash, recoveryCodeHash] = await Promise.all([
      bcrypt.hash(password, BCRYPT_ROUNDS),
      bcrypt.hash(recoveryCode, BCRYPT_ROUNDS),
    ]);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      username: normalizedUsername,
      password: passwordHash,
      recoveryCodeHash,
    });

    req.session.userId = user._id.toString();
    req.session.username = user.username;

    // Plaintext recovery code is returned exactly once; only its hash is stored.
    return res.status(201).json({ data: { user: toPublicUser(user), recoveryCode } });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ error: 'Unable to create account. Please try again.' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Re-select the hashed password (select:false on the schema) so bcrypt.compare can run.
    const user = await User.findOne({ username: username.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.userId = user._id.toString();
    req.session.username = user.username;
    return res.status(200).json({ data: { user: toPublicUser(user) } });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ error: 'Unable to sign in. Please try again.' });
  }
}

async function logout(req, res) {
  try {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({ data: { message: 'Logged out.' } });
    });
  } catch (error) {
    console.error('logout error:', error);
    res.status(500).json({ error: 'Unable to log out. Please try again.' });
  }
}

async function me(req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });
    return res.status(200).json({ data: { user: toPublicUser(user) } });
  } catch (error) {
    console.error('me error:', error);
    return res.status(500).json({ error: 'Unable to load session.' });
  }
}

// Looks up the user and bcrypt-compares the submitted code; generic errors avoid leaking which field failed.
async function findUserByIdentifier(identifier) {
  const value = (identifier || '').trim().toLowerCase();
  return User.findOne({ $or: [{ username: value }, { email: value }] }).select('+recoveryCodeHash');
}

async function recoverVerify(req, res) {
  try {
    const { username, recoveryCode } = req.body;
    if (!username || !RECOVERY_CODE_REGEX.test(recoveryCode || '')) {
      return res.status(400).json({ error: 'Invalid details.' });
    }
    const user = await findUserByIdentifier(username);
    if (!user || !(await bcrypt.compare(recoveryCode, user.recoveryCodeHash))) {
      return res.status(400).json({ error: 'Invalid details.' });
    }
    return res.status(200).json({ data: { verified: true } });
  } catch (error) {
    console.error('recoverVerify error:', error);
    return res.status(500).json({ error: 'Unable to verify. Please try again.' });
  }
}

async function recoverReset(req, res) {
  try {
    const { username, recoveryCode, newPassword } = req.body;
    if (!username || !RECOVERY_CODE_REGEX.test(recoveryCode || '')) {
      return res.status(400).json({ error: 'Invalid details.' });
    }
    if (!newPassword || newPassword.length < PASSWORD_MIN) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await findUserByIdentifier(username);
    if (!user || !(await bcrypt.compare(recoveryCode, user.recoveryCodeHash))) {
      return res.status(400).json({ error: 'Invalid details.' });
    }

    // Issue a brand-new code and invalidate the old one; return the new plaintext once.
    const nextCode = generateRecoveryCode();
    const [passwordHash, recoveryCodeHash] = await Promise.all([
      bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      bcrypt.hash(nextCode, BCRYPT_ROUNDS),
    ]);
    user.password = passwordHash;
    user.recoveryCodeHash = recoveryCodeHash;
    await user.save();

    return res.status(200).json({ data: { recoveryCode: nextCode } });
  } catch (error) {
    console.error('recoverReset error:', error);
    return res.status(500).json({ error: 'Unable to reset password. Please try again.' });
  }
}

module.exports = { register, login, logout, me, recoverVerify, recoverReset };
