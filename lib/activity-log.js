const { prisma } = require("./prisma");

// Best-effort logging — a logging failure should never break the actual
// operation the user is trying to perform, so errors here are swallowed.
async function logActivity(userName, action, details, userEmail) {
  try {
    await prisma.activityLog.create({
      data: { userName: userName || "Unknown user", userEmail: userEmail || null, action, details: details || null },
    });
  } catch (e) {
    console.error("Activity log failed:", e.message);
  }
}

module.exports = { logActivity };
