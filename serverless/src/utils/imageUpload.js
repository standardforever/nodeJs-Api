const multer = require("multer");
require("dotenv").config();
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWSS_ACCESS_KEY,
  secretAccessKey: process.env.AWSS_SECRET_KEY,
  region: process.env.REGION,
});

let upload = multer({
  limits: { fileSize: 1024 * 1024 * 10 },
  fileFilter: function (req, file, done) {
    if (file.mimetype.startsWith("image/")) {
      done(null, true);
    } else {
      done("File type is not supported", false);
    }
  },
});

const uploadToS3 = (id, fileData) => {
  return new Promise((resolve, reject) => {
    const s3Params = {
      Bucket: "finest50-image-upload",
      Key: `${id}/photos/${Date.now().toString()}-${fileData?.originalname}`,
      Body: fileData.buffer,
      ContentType: fileData?.mimetype,
      ACL: "public-read",
    };

    s3.upload(s3Params, (err, data) => {
      if (err) {
        console.log("err", err), reject(err);
      }
      //   console.log("data", data);
      return resolve(data);
    });
  });
};

module.exports = { upload, uploadToS3 };
