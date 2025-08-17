import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong wile generating regresh and access token")
    }
}


// Register Users 
const registerUser = asyncHandler(async(req, res)=>{
    const {username, fullName, email, password} = req.body;
    if(
        [fullName, email, username, password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{username}, {email}],
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "User registration failed")
    }

    return res
    .status(200)
    .json(new ApiResponse(201, createdUser, "User registered successfully"))
})

// login Users 
const loginUser = asyncHandler(async(req,res)=>{
    const {email, username, password} = req.body;
    if(!(email || username)){
        throw new ApiError(400, "Email or Username is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "Login Successfully"))
})

// Logout user
const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Log out successfully"))
})

//refresh Token
const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken|| req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken},
            "Access token refreshed"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})

// Get Currentt User
const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetch Successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser
}