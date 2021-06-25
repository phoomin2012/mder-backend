import JWT from 'jsonwebtoken'

export function signJWT (payload, expire = '1d') {
  const jwt = JWT.sign(payload, 'mder-secret-1234567890ABCabc!@#', {
    algorithm: 'HS256',
    expiresIn: expire,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  })
  return jwt
}

export function verifyJWT (token, options = {}) {
  return JWT.verify(token, 'mder-secret-1234567890ABCabc!@#', {
    algorithm: 'HS256',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    ...options,
  })
}

export function decodeJWT (token) {
  return JWT.decode(token)
}
