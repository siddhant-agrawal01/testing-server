import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.mode.js"
import { Comment } from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const boolLike = asyncHandler(async(req, res) => {
    const{videoId} = req.params
    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video Id is required")
    }

    let video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "Video does not exists")
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, (isLiked) ? true:false, "Fetched Successfully"))
})

const boolCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Valid comment Id is required")
    }

    let comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError(400, "Comment does not exists")
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, (isLiked) ? true:false, "Fetched Successfully"))
})

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video Id is required")
    }

    let video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "Video does not exists")
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    let like;
    if(isLiked) {
        // Do unlike
        await Like.deleteOne({
            video: videoId,
            likedBy: req.user?._id
        })
        like = false
    } else {
        // do like
        await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        like = true
    }

    video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        }, 
        {
            $project: {
                title: 1,
                description: 1,
                owner: 1
            }
        }
    ])

    const message = (like) ? "Video liked successfully" : "Video unliked successfully"

    return res
    .status(200)
    .json(new ApiResponse(200, video, message))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Valid commentId is required")
    }

    let comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError(400, "Comment does not exists")
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    let like;
    if(isLiked) {
        // Do unlike
        await Like.deleteOne({
            comment: commentId,
            likedBy: req.user?._id
        })
        like = false
    } else {
        // do like
        await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        like = true
    }

    comment = await Comment.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(commentId)
            }
        }, 
        {
            $project: {
                content: 1,
                video: 1,
                owner: 1
            }
        }
    ])

    const message = (like) ? "Comment liked successfully" : "Comment unliked successfully"

    return res
    .status(200)
    .json(new ApiResponse(200, comment, message))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Valid tweetId is required")
    }

    let tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(400, "Tweet does not exists")
    }

    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    let like;
    if(isLiked) {
        // Do unlike
        await Like.deleteOne({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        like = false
    } else {
        // do like
        await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        like = true
    }

    tweet = await Tweet.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(tweetId)
            }
        }, 
        {
            $project: {
                content: 1,
                owner: 1
            }
        }
    ])

    const message = (like) ? "Tweet liked successfully" : "Tweet unliked successfully"

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, message))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: {
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            videoFile: 1,
                            owner: 1,
                            views: 1,
                            thumbnail: 1
                        }
                    }
                ]
            }
        }, 
        {
            $project: {
                _id: 0,
                videos: 1
            }
        }
    ])

    if(!likedVideos) {
        throw new ApiError(400, "Something went wrong while fetching liked videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    boolLike,
    boolCommentLike
}