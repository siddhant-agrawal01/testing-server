import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js"
import { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler( async(req, res) => {
    const{ name, description} = req.body

    if(!name.trim() || !description.trim()) {
        throw new ApiError(400, "Name and description both are required")
    }

    let playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user?._id
    })

    if(!playlist) {
        throw new ApiError(400, "Something went wrong while creating playlist")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))
} ) 

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId?.trim() || !isValidObjectId(userId)) {
        throw new ApiError(400, "Valid userId is required")
    }

    let playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $arrayElemAt: ["$owner", 0]
                }
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(400, "Something went wrong while fetching playlists")
    }

    const message = (playlist.length === 0)?"User has no playlists":"Playlists fetched successfully"

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, message))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId?.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Valid playlistId is required")
    }

    let playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        
        {
            // lookup for playlist owner
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                // pipline for playlist owner details
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            // for playlist owner
            $addFields: {
                playlistOwner: {
                    $arrayElemAt: ["$owner", 0]
                }
            }
        },
        {
            // lookup to get all videos in playlist
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                // This pipeline is used to get all playlist's videos
                pipeline: [
                    {
                        // lookup for video owner details
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // pipleline for specific video owner details
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    {
                        $project: {
                            title: 1,
                            duration: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(400, "Something went wrong while fetching playlist")
    }

    const message = (playlist.length === 0) ? "No playlist exists" : "Playlist fetched successfully" 

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, message))
})

const addVideoToPlaylist = asyncHandler( async(req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId?.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Valid playlistId is required")
    }

    if(!videoId?.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid videoId is required")
    }

    let video = await Video.findById(videoId?.trim())

    if(!video) {
        throw new ApiError(400, "Video not found")
    }

    let playlist = await Playlist.findById(playlistId?.trim())

    if(!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    // check authenticated user is adding videos in playlist
    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorized access")
    }

    // check video is exist in playlist or not
    let videos = playlist.videos

    videos.forEach((video) => {
        if(video.toString() === videoId?.trim().toString()) {
            return res
            .status(200)
            .json(new ApiResponse(200, playlist, `Video already exists in ${playlist.name} playlist`))
        }
    })

    const updatedPlaylist = playlist.videos.push(video._id)
    await playlist.save()

    if(!updatedPlaylist) {
        throw new ApiError(400, "Something went wrong while adding video to playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added successfully"))
} )

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId?.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Valid playlistId is required")
    }

    if(!videoId?.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid videoId is required")
    }

    let video = await Video.findById(videoId?.trim())

    if(!video) {
        throw new ApiError(400, "Video not found")
    }

    let playlist = await Playlist.findById(playlistId?.trim())

    if(!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    // check video exists in playlist or not
    const isExist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId?.trim())
            }
        },
        {
            $match: {
                videos: new mongoose.Types.ObjectId(videoId?.trim())
            }
        }
    ])

    if(isExist.toString().length === 0) {
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video does not exists in playlist"))
    }

    let newVideosArray = playlist.videos.filter((video) => {
        return video.toString() != videoId.toString()
    })

    playlist.videos = newVideosArray

    // OR
    // const updatedPlaylist = await Playlist.findByIdAndUpdate(
    //     playlistId?.trim(),
    //     {
    //         $set: {
    //             videos: newVideosArray
    //         }
    //     },
    //     {new: true}
    // )

    const response = await playlist.save({validateBeforeSave: false})

    if(!response) {
        throw new ApiError(400, "Something went wrong while removing video from playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId?.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Valid playlistId is required")
    }

    let playlist = await Playlist.findById(playlistId?.trim())

    if(!playlist) {
        throw new ApiError(400, "Video not exists")
    }

    const response = await Playlist.findByIdAndDelete(playlistId)

    if(!response) {
        throw new ApiError(400, "Something went wrong while deleting playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, response, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId?.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Valid playlistId is required")
    }

    let playlist = await Playlist.findById(playlistId?.trim())

    if(!playlist) {
        throw new ApiError(400, "Playlist does not exists")
    }

    const {name, description} = req.body

    if(!name && !description) {
        throw new ApiError(400, "Playlist name or description is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name, 
                description
            }
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError(400, "Something went wrong while updating playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
