import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import bodyParser from "body-parser";

import imageRoute from "./src/Routes/ImageRoutes.js";

import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.27.1/swagger-ui.css";

const app = express();

dotenv.config();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use(cors());

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("DB connection established");
    })
    .catch(err => {
        console.log(err);
    });

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Swagger options
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Image Uploader API",
            version: "1.0.0",
            description: "API documentation for Image Uploader"
        },
        servers:[
            {
                // url: "https://aditya-yadav-app.vercel.app", 
                url: "http://localhost:4000", 
                description: "Image uploader API"
                
            }
        ]
        },
        apis: ["./src/**/*.js"]
    }

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs, { customCssUrl: CSS_URL }));

app.get("/", (req, res) => {
    // res.send(`<a href = "${process.env.PORT}/api-docs">Swagger Documentation</a>`) //for vercel deployment
    res.send(`<a href = "http://localhost:4000/api-docs">Swagger Documentation</a>`)
});

app.use("/api", imageRoute);

app.listen(process.env.PORT, () => {
    console.log(`Serving on port ${process.env.PORT}`);
});
