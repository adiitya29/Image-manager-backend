import { Router } from "express";
import { v2 as cloudinary } from 'cloudinary';
import Image from "../../Model/ImageModel.js";
import authMiddleware from "../Middleware/authMiddleware.js";


const imageRoute = Router();


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a new image (Protected Route)
 *     tags: [images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image was successfully uploaded
 *       400:
 *         description: Image was not provided
 *       401:
 *         description: Unauthorized - Token required
 *       500:
 *         description: Server Error
 */


imageRoute.post("/upload",authMiddleware, async (req, res) => {
    try {

        const { image, title } = req.body

        if (!image) {
            return res.status(400).json({ message: "image not found" })
        }

        if (!image.startsWith("data:image/jpeg;base64,")) {
            return res.status(400).json({ message: "Invalid base64 image" })

        }

        const result = await cloudinary.uploader.upload_large(image)

        console.log(result);


        await new Image({ 
            title, 
            imageUrl: result.secure_url, 
            public_id: result.public_id,
            uploadedBy: req.user._id
        }).save();

        res.status(200).json({ message: "Image successfully uploaded" })

    } catch (error) {
        res.status(500).json({ message: error })
    }
})


/**
 * @swagger
 * /api/allImages:
 *   get:
 *     summary: Get all images (Protected Route)
 *     tags: [images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all images
 *       401:
 *         description: Unauthorized - Token required
 *       404:
 *         description: No images found
 *       500:
 *         description: Server Error
 */

imageRoute.get("/allImages", authMiddleware,async (req, res) => {
    try {

        const AllImages = await Image.find().populate('uploadedBy', 'username email');

        if (!AllImages.length) {
            return res.status(404).json({ message: "No Image not found" })
        }

        res.status(200).json({
            message: "Images retrieved successfully",
            requestedBy: req.user.username,
            images: AllImages
        });


    } catch (error) {
        res.status(500).json({ message: error })
    }
})


/**
 * @swagger
 * /api/image/{id}:
 *   put:
 *     summary: Update image title (Protected Route)
 *     tags: [images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: the image id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image title updated successfully
 *       400:
 *         description: Invalid image id
 *       401:
 *         description: Unauthorized - Token required
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server Error
 */

imageRoute.put("/image/:id", authMiddleware, async (req, res) => {
    try {
        const id = req.params.id

        const { newTitle } = req.body

        const updatedImage = await Image.findByIdAndUpdate(id, { title: newTitle }, { new: true })

        if (updatedImage === null) {
            return res.status(404).json({ message: "Image not found" })
        }

        res.status(200).json({ 
            message: "Image Title updated",
            updatedBy: req.user.username,
            updatedImage: updatedImage
        });

    } catch (error) {
        res.status(500).json({ message: error })

    }
})


/**
 * @swagger
 * /api/image/{id}:
 *   delete:
 *     summary: Delete an image (Protected Route)
 *     tags: [images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the image to be deleted
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         description: Unauthorized - Token required
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server Error
 */


imageRoute.delete("/image/:id", authMiddleware,async (req, res) => {
    try {

        const id = req.params.id

        const imageToDelete = await Image.findById(id);

        if (!imageToDelete) {
            return res.status(404).json({ message: "Image not found" });
        }

         if (imageToDelete.public_id) {
            try {
                const cloudinaryResult = await cloudinary.uploader.destroy(imageToDelete.public_id);
                console.log("Cloudinary deletion result:", cloudinaryResult);
            } catch (cloudinaryError) {
                console.log("Cloudinary deletion failed:", cloudinaryError);
                // Continue with database deletion even if Cloudinary fails
            }
        } else {
            console.log("No public_id found for image:", id);
        }

        const deletedImage = await Image.findByIdAndDelete(id)

        // if (deletedImage === null) {
        //     return res.status(404).json({ message: "Image not found" })
        // }

        // await cloudinary.uploader.destroy(deletedImage.public_id)

         res.status(200).json({ 
            message: "Image deleted successfully",
            deletedBy: req.user.username,
            imageId: deletedImage._id,
            imageTitle: deletedImage.title
        });

    } catch (error) {
        console.error("Delete route error:", error);
        res.status(500).json({ 
            message: "Server error during deletion",
            error: error.message 
        });
    }
});

/**
 * @swagger
 * /api/myImages:
 *   get:
 *     summary: Get current user's images only (Protected Route)
 *     tags: [images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's images retrieved successfully
 *       401:
 *         description: Unauthorized - Token required
 *       404:
 *         description: No images found
 *       500:
 *         description: Server Error
 */

imageRoute.get("/myImages", authMiddleware, async (req, res) => {
    try {
        // Get only images uploaded by the current authenticated user
        const userImages = await Image.find({ uploadedBy: req.user._id })
            .populate('uploadedBy', 'username email')
            .sort({ createdAt: -1 }); // Show newest first

        res.status(200).json({
            message: "Your images retrieved successfully",
            requestedBy: req.user.username,
            totalImages: userImages.length,
            images: userImages
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


export default imageRoute