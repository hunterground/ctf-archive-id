import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export function validateJWT(token: string | undefined) {
  try {
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return { isValid: false, error: 'Token expired' };
    }

    return {
      isValid: true,
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
    const jwtError = error as VerifyErrors;
    
    if (jwtError.name === 'TokenExpiredError') {
      return { isValid: false, error: 'Token expired' };
    }
    
    if (jwtError.name === 'JsonWebTokenError') {
      return { isValid: false, error: 'Invalid token' };
    }

    return { isValid: false, error: 'Authentication failed' };
  }
}