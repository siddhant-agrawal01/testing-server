import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { getAllVideos } from "./video.controller.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const video = await Video.findById(videoId)

    if(!isValidObjectId(videoId) || !video) {
        throw new ApiError(400, "Either video id is invalid or No video exists")
    }

    const allComments = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },

        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "allVideoComments",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            content: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                allVideoComments: 1,
                _id: 0
            }
        }
    ])

    if(!allComments) {
        throw new ApiError(400, "Something went wrong while getting all comments of video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, allComments[0].allVideoComments, "All comments fetched succesfully"))
})

const addComment = asyncHandler( async (req, res) => {
    const { content } = req.body
    const { videoId } = req.params
    if(!content) {
        throw new ApiError(400, "Empty comment")
    }

    const video = await Video.findById(videoId)

    if(!isValidObjectId(videoId) || !video) {
        throw new ApiError(400, "Either video id is invalid or no video exists")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if(!comment) {
        throw new ApiError(400, "Something went wrong while adding comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { newContent } = req.body

    const comment = await Comment.findById(commentId)

    if(!isValidObjectId(commentId) || !comment) {
        throw new ApiError(400, "Either comment is invalid or no comment exists")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content: newContent
            }
        },
        {new: true}
    )

    if(!updatedComment) {
        throw new ApiError(400, "Something went wrong while updating comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)

    if(!isValidObjectId(commentId) || !comment) {
        throw new ApiError(400, "Either comment Id is invalid or no comment exists")
    }

    const response = await Comment.findByIdAndDelete(commentId)

    if(!response) {
        throw new ApiError(400, "Something went wrong while deleting comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    deleteComment,
    updateComment
}