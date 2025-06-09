// auth/multi-user-support.js
import crypto from 'crypto';
const userSessions = new Map();

function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

function storeUserSession(userId, session) {
  userSessions.set(userId, { ...session, lastAccess: Date.now() });
}

function getUserSession(userId) {
  const session = userSessions.get(userId);
  if (session) {
    session.lastAccess = Date.now();
    return session;
  }
  return null;
}

export { generateUserId, storeUserSession, getUserSession };
