// Auth logic: register, login, logout, me, recover (verify + reset).
// Sessions via express-session (httpOnly cookie). Passwords + recovery codes
// are bcrypt-hashed and never returned to the client.
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const CODE_RE = /^\d{4}$/;

function randomCode() {
  // 4-digit recovery code, e.g. "0427".
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function register(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !USERNAME_RE.test(username)) {
      return res
        .status(400)
        .json({ error: "Username must be 3-20 letters, numbers or underscore" });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Generate the recovery code, store ONLY its hash, return plaintext once.
    const recoveryCode = randomCode();
    const recoveryHash = await bcrypt.hash(recoveryCode, 10);

    // New accounts are created 'pending' (DB default). We do NOT start a session:
    // the user must wait for an admin to approve the account before logging in.
    const user = await User.create({ username, passwordHash, role: "staff", recoveryHash });

    return res.status(201).json({
      data: {
        user,
        recoveryCode,
        pending: true,
        message: "Account created. An administrator must approve it before you can sign in.",
      },
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findByUsernameWithSecrets(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const ok = await bcrypt.compare(password, user.Password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Block sign-in until an admin has approved the account.
    if (user.Status !== "approved") {
      return res
        .status(403)
        .json({ error: "Your account is pending admin approval. Please try again later." });
    }

    req.session.userId = user.User_ID;
    req.session.username = user.UserName;

    // Strip secrets before responding.
    const safe = {
      User_ID: user.User_ID,
      UserName: user.UserName,
      Role: user.Role,
      Status: user.Status,
    };
    return res.status(200).json({ data: { user: safe } });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(200).json({ data: { message: "Logged out" } });
  });
}

async function me(req, res) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.status(200).json({ data: { user } });
}

// Step 1 of recovery: verify the 4-digit code matches the stored hash.
async function recoverVerify(req, res) {
  try {
    const { username, code } = req.body;
    if (!username || !CODE_RE.test(code || "")) {
      return res.status(400).json({ error: "Valid username and 4-digit code required" });
    }
    const user = await User.findByUsernameWithSecrets(username);
    if (!user) return res.status(400).json({ error: "Invalid username or code" });
    const ok = await bcrypt.compare(code, user.RecoveryCodeHash);
    if (!ok) return res.status(400).json({ error: "Invalid username or code" });
    return res.status(200).json({ data: { verified: true } });
  } catch (err) {
    console.error("recoverVerify error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Step 2 of recovery: with a valid code, set a new password and issue a NEW code.
async function recoverReset(req, res) {
  try {
    const { username, code, newPassword } = req.body;
    if (!username || !CODE_RE.test(code || "")) {
      return res.status(400).json({ error: "Valid username and 4-digit code required" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const user = await User.findByUsernameWithSecrets(username);
    if (!user) return res.status(400).json({ error: "Invalid username or code" });
    const ok = await bcrypt.compare(code, user.RecoveryCodeHash);
    if (!ok) return res.status(400).json({ error: "Invalid username or code" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(user.User_ID, passwordHash);

    const newCode = randomCode();
    await User.updateRecoveryHash(user.User_ID, await bcrypt.hash(newCode, 10));

    return res.status(200).json({ data: { recoveryCode: newCode } });
  } catch (err) {
    console.error("recoverReset error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { register, login, logout, me, recoverVerify, recoverReset };
