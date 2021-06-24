import { sign, verify, decode } from 'jsonwebtoken'

export function signJWT(payload, expire = '1d') {
    const jwt = sign(payload, 'mder-secret-1234567890ABCabc!@#', {
        algorithm: 'HS256',
        expiresIn: expire,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
    })
    return jwt
}

export function verifyJWT(token, options = {}) {
    return verify(token, 'mder-secret-1234567890ABCabc!@#', {
        algorithm: 'HS256',
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        ...options,
    })
}

export function decodeJWT(token) {
    return decode(token)
}