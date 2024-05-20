// Import the 'http' module to create an HTTP server
const http = require('http');
const HLS = require('hls-server');

const AWS = require('aws-sdk');
const { log } = require('console');
require('dotenv').config({ path: '../.env' });

// Define the hostname and port on which the server will listen
const hostname = '127.0.0.1';
const port = 3000;


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

const getSignedUrl = (bucketName, fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60 // URL expiry time in seconds
  };
  return s3.getSignedUrl('getObject', params);
};



// Create the HTTP server
const server = http.createServer((req, res) => {
  // Set the HTTP status code and content type in the response header
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');

const bucketName = 'convertedvs';
const fileName = 'myVideo/index.m3u8';

const signedUrl = getSignedUrl(bucketName, fileName);
console.log('Signed URL:', signedUrl);


  // Write a response message
  res.end("Got something?");
});



// Start the server and have it listen on the specified hostname and port
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
