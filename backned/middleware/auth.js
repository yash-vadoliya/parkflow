// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token)
//     return res.status(401).json({ message: 'Access Denied: No Token Provided!' });

//   try {
//     const decode = jwt.verify(token, process.env.JWT_SECRET)
//     req.user = {
//       user_id: decode.user_id,
//       role: decode.role
//     };
//     next();
//   } catch (err) {
//     return res.status(403).json({ message: 'Invalid Token!' });
//   }
// }

// const authorizeRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     // Check if user exists and if their role is in the allowed array
//     if (!req.user || !allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         message: "Access Denied. You do not have permission.",
//         requiredRoles: allowedRoles,
//         yourRole: req.user ? req.user.role : 'No role found'
//       });
//     }

//     next();
//   };
// };

// module.exports = { authenticateToken, authorizeRoles };

const jwt = require('jsonwebtoken');
require('dotenv').config();

const revokedTokens = new Set();

const revokeToken = (token) => {
  if (token) revokedTokens.add(token);
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
  if (revokedTokens.has(token))
    return res.status(401).json({ message: 'Session has been logged out.' });

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: Attach the entire payload so it handles both 'user_id' and 'cust_id'
    req.user = decode;
    req.token = token;

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid Token!' });
  }
}

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists and if their role is in the allowed array
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied. You do not have permission.",
        requiredRoles: allowedRoles,
        yourRole: req.user ? req.user.role : 'No role found'
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles, revokeToken };
