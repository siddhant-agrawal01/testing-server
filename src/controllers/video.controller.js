import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, destroyOnCloudinary} from "../utils/cloudinary.js"

// get-videos?page=1&limit=10&query=video&sortBY=title&sortType=asc&userid=65a7b00d58a2d12d965599ca
const getAllVideos = asyncHandler(async (req, res) => {

    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);

    if(page <= 0){
        page = 1;
    }
    if(limit <= 0){
        limit = 10;
    }

    let pipeline = []

    if(isValidObjectId(userId)) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
        console.log(pipeline);
    } else {
        pipeline.push({
            $match: {
                $or: [
                    {title: {$regex: query, $options: 'i'}},
                    {description: {$regex: query, $options: 'i'}}
                ]
            }
        })
    }

    pipeline.push(

        {
            $project: {
                title: 1,
                videoFile: 1,
                thumbnail: 1
            }
        },

        {
            $sort: {
                [sortBy]:  sortType === 'asc' ? 1 : -1
            }
        },

        { $skip: ( (page-1) * limit ) },

        { $limit: limit }
    )

    const videos = await Video.aggregate(pipeline)

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
    //TODO: get all videos based on query, sort, pagination
})

const getAllDBVideo = asyncHandler( async(req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {

            }
        }
    ]
    )

    if(!videos) {
        throw new ApiError(400, "Something went wrong while fetching videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
} )

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(
        [title, description].some( (field) => field?.trim === "" )
    ) {
        throw new ApiError(400, "Title and description both are required")
    }
   
    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(
        [videoLocalPath, thumbnailLocalPath].some( (field) => field?.trim === "" )
    ) {
        throw new ApiError(400, "Video and thumbnail both are required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(
        [videoFile, thumbnail].some( (field) => field?.trim === "" )
    ) {
        throw new ApiError(400, "There is some problem in uploading video and thumbnail")
    }

    const duration = videoFile?.duration

    if(!duration) {
        throw new ApiError(400, "Some problem in getting video URL from cloudinary")
    }


    const video = await Video.create(
        {
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: req.user?._id,
            title,
            description,
            duration,
            isPublished: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video uploaded successfully")
    )

    // TODO: get video, upload to cloudinary, create video
    // Task completed
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId?.trim()) {
        throw new ApiError(400, "No results")
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            email: 1,
                            avatar: 1,
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
    ]);

    if(!video) {
        throw new ApiError(400, "No videos exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    )
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath  =  req.file?.path

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "No videos exists")
    }
    
    if( !title || !description || !thumbnailLocalPath) {
        throw new ApiError(400, "Please give title or description or thumbnail to change")
    }

    const cloudinaryReponse = await uploadOnCloudinary(thumbnailLocalPath)

    if(!cloudinaryReponse) {
        throw new ApiError(500, "There is some problem in uploading thumbnail")
    }

    const oldThumbnailUrl = video?.thumbnail;

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: cloudinaryReponse.url
            }
        },
        {new: true}
    )

    await destroyOnCloudinary(oldThumbnailUrl);

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Videos details updated")
    )
    
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId?.trim() && isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is missing")
    }
    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "No video exists")
    }

    const{_id, videoFile, thumbnail, owner} = video;

    if(owner?._id?.toString() !== req.user?._id?.toString()) {
        throw new ApiError(400, "Unauthorized access")
    }

    if(!videoFile) {
        throw new ApiError(400, "No video exists")
    }

    if(!thumbnail) {
        throw new ApiError(400, "No thumbnail exists")
    }

    const response = await Video.findByIdAndDelete(_id);

    if(!response) {
        throw new ApiError(400, "Delete action failed")
    }
    await destroyOnCloudinary(videoFile, "video")
    await destroyOnCloudinary(thumbnail)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "No video exists")
    }

    const owner = video.owner;

    if(req.user._id.toString() !== owner.toString()) {
        throw new ApiError(404, "Unauthorized Access")
    }

    const isPublished = !(video.isPublished)

   const updatedVideo = await Video.findByIdAndUpdate( videoId, {
    $set: { isPublished  }
   } )

   return res
   .status(200)
   .json(new ApiResponse(200, updatedVideo, "Video settings changed successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllDBVideo
}
