import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.mode.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const{ content } = req.body;

    if(!content) {
        throw new ApiError(400, "Content is required")
    }

    const userTweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if(!userTweet) {
        throw new ApiError(400, "Something went wrong while creating tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, userTweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const{ userId } = req.params
    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    // check user exists or not
    const response = await User.findById(userId) 

    if(!response) {
        throw new ApiError(400, "No user exists")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    console.log(userTweets);

    if(userTweets.length === 0) {
        throw new ApiError(400, "No tweets uploaded by user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { newContent } = req.body
    
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    // is tweetId exists
    const tweet = await Tweet.findById( tweetId )

    if(!tweet) {
        throw new ApiError(400, "No tweet exists")
    }

    // Check tweet owner and logined user
    if(tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorised access")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: newContent
            }
        }, 
        {new: true}
    )

    if(!updatedTweet) {
        throw new ApiError(400, "There is some problem in updating tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweet id is invalid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(400, "No tweet exists")
    }

    // validation
    if(tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorised access")
    }

    const response = await Tweet.findByIdAndDelete(tweetId)

    if(!response) {
        throw new ApiError(400, "Something went wrong while deleting tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, response, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
