import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.model.js"
// import { ToastContainer } from "react-toastify"
import { Like } from "../models/like.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id
    
    const user = await User.findById(userId)

    if(!user) {
        throw new ApiError(400, "Something went wrong while fetching user details")
    }

    let totalVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: 'videosCount'
        }
    ])


    if(!totalVideos) {
        throw new ApiError(400, "Something went wrong while fetching total videos")
    }

    if(!totalVideos[0]) {
        totalVideos[0] = {
            videosCount: 0
        }
    }

    let totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)    
            }
        },

        {
            $group: {
                _id: "null",
                viewsCount: {
                    $sum: "$views"
                }
            }
        },
        {
            $project: {
                _id: 0,
                viewsCount: 1
            }
        }
    ])

    if(!totalViews) {
        throw new ApiError(400, "Something went wrong while fetching total views")
    }

    if(!totalViews[0]) {
        totalViews[0] = {
            viewsCount: 0
        }
    }

    let subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: 'subscribersCount'
        },
        {
            $project: {
                _id: 0,
                subscribersCount: 1
            }
        }
    ])

    if(!subscribers) {
        throw new ApiError(400, "Something went wrong while fetching subscribers")
    }

    if(!subscribers[0]) {
        subscribers[0] = {
            subscribersCount: 0
        }
    }

    const totalLikes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: 'likesCount'
        },
        {
            $project: {
                _id: 0,
                likesCount: 1
            }
        }
    ])

    if(!totalLikes[0]) {
        totalLikes[0] = {
            likesCount: 0
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {totalVideos: totalVideos[0], totalViews: totalViews[0], subscribers: subscribers[0], totalLikes: totalLikes[0]}, "Stats get successfully"))
})

const getChannelVideos = asyncHandler( async(req, res) => {
    const userId = req.user?._id
    console.log(userId);

    const user = await User.findById(userId)

    if(!user) {
        throw new ApiError(400, "Something went wrong while fetching user details")
    }

    const userVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user)
            }
        }
    ])

    if(!userVideos) {
        throw new ApiError(400, "Something went wrong while fetching user videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, userVideos, "User videos fetched successfully"))
} )

export {
    getChannelStats,
    getChannelVideos
}