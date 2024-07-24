import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefershToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
    } catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler(async(req,res) => {

    // get user data from frontend
    // validation - not empty
    // check if user already exist : username , email
    // check for image , check for avatar
    //upload them to cloudinary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // chech for user creation
    // return res


    // 1. acccepting data from frontend
    const {fullName,email,username,password} = req.body

    // if(fullName === ""){
    //     throw new ApiError(400,"Full Name is required")
    // }
    // 2. checking all fields are present or not
    if(
        [fullName,email,username,password].some((field) => field?.trim())
    ){
        throw new ApiError(400,"All fields are required")
    }
    // 3. validating the user its account is not existing already
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser) {
        throw new ApiError(409, "User with this email or username already exist")
    }

    // 4. Handling the avatar and cover image
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath = "";
    if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.lenght > 0){
        coverImageLocalPath = req.files.coverImage[0].path}
    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    
    if(coverImageLocalPath){
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }
    if(!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    // 5. creating a user in data base
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 6. Returning the response of created user
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError(500,"Something went wrong while registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
    })
const loginUser = asyncHandler(async(req,res) =>{
    // taking data from request body
    // check the username \\ email exist
    // find user
    // check password
    // generate access and refresh tocken
    // send cookies 

    // 1. accepting data from req.body

    const {email,username,password} = req.body;

    if(!(username || email)){
        throw new ApiError(400,"username or password is required")
    }

    // 2. finding the user

    const user = await User.findOne(
        {
            $or : [{username},{email}]
        }
    )

    if(!user) {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user password")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefershToken(user._id)

    const logedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken, option")
    .cookie("refereshToken,options")
    .json(new ApiResponse(
        200,
        {
            user : logedInUser , accessToken,
            refreshToken
        },
        "User logged In Successfully"
        ))
})

const logoutUser = asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,{
            $unset : {
                refreshToken : 1
            },
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out "))
})
const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(400,"Invalid Referesh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secured: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefershToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(200,{
                accessToken,
                refreshToken : newRefreshToken
            },
            "Access token refreshed"
        )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confirmedPassword} = req.body

    if(!(newPassword === confirmedPassword)){
        throw new ApiError(400,"New Password and Confirmed Password are not same")
    }
    const user = await User.findById(req.user?._id)

    if(!(isPasswordCorrect(oldPassword))){
        throw new ApiError(400,"Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})
const updateAccountDetail = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },{
            new : true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const newAvatarLocalpath = req.file?.path

    if(!newAvatarLocalpath){
        throw new ApiError(400,"Avatar file is missing ")
    }

    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set:{
    //             avatar : avatar.url
    //         }
    //     },
    //     {new : true}
    // ).select("-password -refreshToken")
    const user = await User.findById(req.user?._id)

    const presentAvatarURL = user.avatar
    
    const newAvatar = await uploadOnCloudinary(newAvatarLocalpath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading an avatar")
    }

    try {
        const updation = await User.updateOne({_id:user._id},{
            $set:{
                avatar : newAvatar.url
            }
        })

        const deletion = await deleteFromCloudinary(presentAvatarURL)

    } catch (error) {
        throw new ApiError(500,"Image Updation failed")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar image updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const newCoverImageLocalpath = req.file?.path

    if(!newCoverImageLocalpath){
        throw new ApiError(400,"Cover Image file is missing ")
    }

    const newCoverImage = await uploadOnCloudinary(newCoverImageLocalpath)

    if(!newCoverImage.url){
        throw new ApiError(400,"Error while uploading an avatar")
    }

    const user = await User.findById(req.user?._id)
    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set:{
    //             coverImage: coverImage.url
    //         }
    //     },
    //     {new : true}
    // ).select("-password -refreshToken")
    const pastCoverImage = user.coverImage

    const updation = await User.updateOne({_id:user._id},{
        $set:{
            coverImage : newCoverImage.url
        }
    })
    if(pastCoverImage){
        const deletion = deleteFromCloudinary(pastCoverImage)
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover image updated successfully")
    )
})
const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username} = req.paramas

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount : {
                    $size: "$subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond : {
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName : 1,
                username: 1,
                subscriberCount:1,
                channelsSubscribedTo:1,
                coverImage:1,
                avatar: 1,
                isSubscribed: 1,
                email : true
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel does not required")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})
const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $lookup:{
                from: "vedios",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as : "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                            }
                        ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    getUserChannelProfile,
    getWatchHistory
}
