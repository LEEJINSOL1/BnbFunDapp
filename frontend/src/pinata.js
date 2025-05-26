// src/pinata.js
import axios from "axios";
const PINATA_API_KEY    = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.REACT_APP_PINATA_SECRET_API_KEY;

export const pinata = {
  pinFileToIPFS: async (file, options = {}) => {
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const data = new FormData();
    data.append("file", file);
    if (options.pinataMetadata) {
      data.append("pinataMetadata", JSON.stringify(options.pinataMetadata));
    }
    const res = await axios.post(url, data, {
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });
    return res.data;
  },
};
