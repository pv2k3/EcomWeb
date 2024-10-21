const express = require("express");
const Image = require("../models/IMAGES");
const app = express();

const router = express.Router();

router.get('/image/:imageId', async (req, res) => {
    try {
        const image = await Image.findById(req.params.imageId);
        if (!image) {
            return res.status(404).send('Image not found');
        }

        res.contentType(image.contentType);
        res.send(image.image);
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).send('Error retrieving image');
    }
});


module.exports = router;