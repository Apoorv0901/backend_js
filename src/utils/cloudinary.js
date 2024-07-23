import {v2 as cloudinary} from "cloudinary";
import { ApiError } from "./apiError.js";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        console.log("file is uploaded on cloudinary",response.url)
        fs.unlinkSync(localFilePath);
        return response
    } catch(error) {
        fs.unlinkSync(localFilePath) // remove the localy saved temporar file as upload operation got failed
        return null;
    }

}

const deleteFromCloudinary = async(fileURL)=>{
    try {
        const response = await cloudinary.uploader.destroy(fileURL,{resource_type : auto})
        console.log("file is deleted from cloudinary")
        return response
    } catch (error) {
        throw new ApiError((501,"Unable to delete Image"))
    }
}
export {uploadOnCloudinary,
    deleteFromCloudinary
}