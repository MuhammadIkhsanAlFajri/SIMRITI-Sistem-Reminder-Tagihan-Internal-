const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function scanInvoice(file) {

    const form = new FormData();

    console.log("================================");
    console.log("MENGIRIM KE PYTHON OCR...");
    console.log("Path:", file.path);
    console.log("Original Name:", file.originalname);
    console.log("Mime Type:", file.mimetype);
    console.log("================================");


    form.append(
        "file",
        fs.createReadStream(file.path),
        {
            filename: file.originalname,
            contentType: file.mimetype
        }
    );


    try {

        const response = await axios.post(

            "http://127.0.0.1:5000/ocr",

            form,

            {
                headers: {
                    ...form.getHeaders()
                },

                maxBodyLength: Infinity,

                maxContentLength: Infinity,

                timeout: 120000
            }

        );


        return response.data;


    } catch (err) {

        console.log("================================");
        console.log("OCR ERROR");

        console.log(
            "ERROR CODE:",
            err.code
        );

        console.log(
            "STATUS:",
            err.response?.status
        );

        console.log(
            "DATA:",
            err.response?.data
        );

        console.log("================================");


        throw err;

    }

}


module.exports = {
    scanInvoice
};