// Vercel Serverless Function — wraps the Express backend
const app = require('../backend/server');

// Export as serverless handler
module.exports = (req, res) => {
  // Vercel sets this env var automatically
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }
  return app(req, res);
};
