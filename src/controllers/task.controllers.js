import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Task} from "../models/task.model.js"

// Create Task
const createTask = asyncHandler(async(req, res)=>{
    const {title, description, completed} = req.body
    if(!title ||title.trim()===""){
        throw new ApiError(400, "Task title is required")
    }
    const newTask = await Task.create({
        title,
        description,
        completed: completed || false,
        user: req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, newTask, "Task created Successfully"))
})

// Get task from Current user
const getTasks = asyncHandler(async(req, res)=>{
    const tasks = await Task.find({user: req.user._id})

    return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"))

})

// Get task by single id
const getTaskById = asyncHandler(async(req, res)=>{
    const {taskId} = req.params
    const singleTask = await Task.findOne({_id:taskId, user: req.user._id})
    if(!singleTask){
        throw new ApiError(404, "Task not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"))

})

// update tasks 
const updateTask = asyncHandler(async(req, res)=>{
    const {taskId} = req.params
    const {title, description, completed} = req.body
    const updatedTask = await Task.findOneAndUpdate(
        {_id: taskId, user: req.user._id},
        {title, description, completed},
        {new: true, runValidators: true}
    )

    if(!updatedTask){
        throw new ApiError(404, "Task not found or not authorized")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"))

})

export {
    createTask,
    getTasks,
    getTaskById,
    updateTask
}