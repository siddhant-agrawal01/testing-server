import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express()

// middlewares
app.use(cors({
    origin: '*',
    credentials: true
}))

// app.use(cors({
//     origin: ["https://deploy-mern-1wq.vercel.app"],
//     credentials: true
// }))

// accept json format data
app.use(express.json({limit: "50000kb"}))

// url encoding
app.use(express.urlencoded({extended: true, limit: "50000kb"}))

// for files at server
app.use(express.static("public"))
app.use(cookieParser())

// routes export
import userRouter from './routes/user.route.js'
import videoRouter from './routes/video.route.js'
import tweetRouter from './routes/tweet.route.js'
import commentRouter from './routes/comment.route.js'
import subscriptionRouter from './routes/subscription.route.js'
import playlistRouter from './routes/playlist.route.js'
import likeRouter from './routes/like.route.js'
// import dislikeRouter from './routes/dislike.route.js'
import dislikeRouter from './routes/dislike.route.js'
import dashboardRouter from './routes/dashboard.route.js'
import healthcheckRouter from './routes/healthcheck.route.js'
import searchRouter from './routes/search.routes.js';

// router decleration
// yaha routes aur controllers ko alag-2 kerdiya h to "app.get()" use nhi ker sakte.
// Ab hame middleware use kerna padega
app.use("/api/v1/users", userRouter)
// url - http://localhost:8000/api/v1/users/register
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/dislikes", dislikeRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/search", searchRouter)

export default app