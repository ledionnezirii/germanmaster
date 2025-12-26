const {
  handleJoinRace,
  handlePlayerReady,
  handleSubmitRaceAnswer,
  handleLeaveRace,
} = require("../controllers/raceController")

const initRaceSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Race] User connected: ${socket.id}`)

    // Join a race room
    socket.on("joinRace", (data) => {
      console.log("[Race] Join event:", data)
      handleJoinRace(socket, io, data)
    })

    // Player ready
    socket.on("playerReady", (data) => {
      console.log("[Race] Player ready:", data)
      handlePlayerReady(socket, io, data)
    })

    // Submit answer
    socket.on("submitAnswer", (data) => {
      console.log("[Race] Submit answer:", data)
      handleSubmitRaceAnswer(socket, io, data)
    })

    // Leave race
    socket.on("leaveRace", (data) => {
      console.log("[Race] Leave race:", data)
      handleLeaveRace(socket, io, data)
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[Race] User disconnected: ${socket.id}`)
    })
  })
}

module.exports = { initRaceSocket }