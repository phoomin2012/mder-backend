import Countdown from '../model/countdown.js'
import { io } from '../module/server.js'

export default function onCountdownRemove (socket) {
  socket.on('countdown.remove', async (id) => {
    const counting = await Countdown.findById(id)

    if (counting) {
      io.emit('countdown.stop', counting)
      await counting.remove()
    }
  })
}
