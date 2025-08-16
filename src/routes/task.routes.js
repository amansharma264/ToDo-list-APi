import { Router } from "express";
import { createTask, getTaskById, getTasks, updateTask } from "../controllers/task.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const router = Router();

router.route("/create-task").post(verifyJWT, createTask)
router.route("/get-tasks").get(verifyJWT, getTasks)
router.route("/get-task/:taskId").get(verifyJWT, getTaskById)
router.route("/update-task/:taskId").put(verifyJWT, updateTask)


export default router