import JWT from 'jsonwebtoken'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'mder-secret-1234567890ABCabc!@#'
process.env.JWT_ISSUER = process.env.JWT_ISSUER || 'mder-issuer'
process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'mder-audience'

export const SECRET = process.env.JWT_SECRET

export function signJWT (payload, expire = '1d') {
  const jwt = JWT.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: expire,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  })
  return jwt
}

export function verifyJWT (token, options = {}) {
  return JWT.verify(token, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    ...options,
  })
}

export function decodeJWT (token) {
  return JWT.decode(token)
}
