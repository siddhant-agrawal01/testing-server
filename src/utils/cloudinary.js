import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';          
import {extractPublicId} from "cloudinary-build-url";
import { ApiError } from './ApiError.js';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



// Upload on cloudinary 
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploded succesfully
        // console.log("File is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        // there is problem in localfilepath or prblm in uploading file on cloudinary,
        // there is chances of file be malicious so we unlink this form our server,
        // unlink - delete from server
        // Sync means mandatory to delete.
        console.log("There is some in uploading data on cloudinary");
        console.log(error);
        fs.unlinkSync(localFilePath); //remove the locally saved temprory file as the upload operation is failed.
        return null;
    }
}

const destroyOnCloudinary = async (url, resourceType = "image") => {

    try {
        if(!url) {
            throw new ApiError(400, "Url is empty")
        }

        const publicId = extractPublicId(url)

        // console.log("Url - ", url)
        // console.log("Public Id - ", publicId);
     
        await cloudinary.uploader
        .destroy(publicId, {resource_type: resourceType})
        .then((result) => {
            console.log(result);
        });
        return;

    } catch (error) {
        console.log("There is some problem in deleting data from cloudinary");
        throw new ApiError(400, error)
    }
}


export {uploadOnCloudinary, destroyOnCloudinary}