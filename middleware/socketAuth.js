import passport from './passport.js'

export default (socket, next) => {
  passport.authenticate('jwt', (err, user, info) => {
    if (err) socket.disconnect()
    socket.handshake.user = user
    return next()
  })(socket.request, {}, next)
}
