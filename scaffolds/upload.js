require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { readFileSync } = require("fs");
const { join } = require("path");

// Create an S3 client
const s3Client = new S3Client({
  region: "auto", // or your specific region
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.CF_ENDPOINT,
  forcePathStyle: true, // Needed for Cloudflare R2
  signatureVersion: "v4",
});

const bucketName = "scaffolds-manifest";
const filePath = join(__dirname, "scaffolds.json");
const keyName = "scaffolds.json";

const uploadFile = async () => {
  try {
    const data = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: keyName,
        Body: readFileSync(filePath),
        ContentType: "application/json",
      }),
    );
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }
};

uploadFile();
