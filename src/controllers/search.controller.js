import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const searchVideo = asyncHandler(async (req, res) => {
    let{ searchInput } = req.body;

    let queryObject = {};

    if(searchInput) {
        queryObject.title = { $regex: searchInput, $options: 'i' };
    }

    let data = Video.find(queryObject);
    if(!data.data) {
        queryObject = {};
        console.log(queryObject);
        queryObject.description = { $regex: searchInput, $options: 'i' };
        data = Video.find(queryObject);
    }

    const page = 1;
    const limit = 10;

    const skip = (page-1)*limit;

    data = data.skip(skip);

    const APIData = await data;

    if(!APIData) {
        throw new ApiError(401, "Something went wrong");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videos: APIData
            },
            "Video fetched successfully"
        )
    )
})

export {
    searchVideo
}