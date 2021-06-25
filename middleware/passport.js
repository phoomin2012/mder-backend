import passport from 'passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import staffModel from '../model/staff.js'
import { SECRET } from '../module/jwt.js'

passport.use(new Strategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
}, async (payload, done) => {
  // Fetch user data
  const user = await staffModel.findById(payload.uid).exec()

  if (user) {
    return done(null, user)
  } else {
    // debug && console.log('Unauthorized: no user exist')
    return done(null, false)
  }
}))

export default passport
export const jwtMiddleware = passport.authenticate('jwt', { session: false })
