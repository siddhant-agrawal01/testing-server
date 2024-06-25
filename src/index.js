// import mongoose from "mongoose"
// import {DB_NAME} from "./constants";

// require("dotenv").config({path: './env'})
import dotenv from 'dotenv'
import connnectDB from "./db/index.js";
import app from "./app.js"; 

dotenv.config({
    path: "./.env"
})

connnectDB()
.then(() => {
    
    app.on("error", (error) => {
        console.log("Error : ", error);
        throw error        
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })    
})
.catch((err) => {
    console.log("MongoDB Conntection Failed !!!...", err);
})


// M-1
// import express from "express";
// const app = express();

// ;( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("Error ", error);
//             throw error;
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("ERROR : ", error);
//         throw error;
//     }
// })()