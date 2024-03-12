const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dmdv1pt2f",
  api_key: "545312635793221",
  api_secret: "tbWBgdLcgs6z1Oq8zzgVlxYwZzk",
});

module.exports = cloudinary;
