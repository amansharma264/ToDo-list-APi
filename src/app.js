import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Now we import the routes
import taskRouter from "./routes/task.routes.js"
import authRouter from "./routes/auth.routes.js"


// declaration of routes 
app.use("/api/v1/tasks", taskRouter)
app.use("/api/v1/auth", authRouter)

export {app}