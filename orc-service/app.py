from flask import Flask, request, jsonify

from pdf2image import convert_from_path

from PIL import Image

import os
import uuid


from ocr_engine import extract_text

from llm_parser import parse_with_ai


app = Flask(__name__)


UPLOAD_FOLDER = "uploads"

TEMP_FOLDER = "temp"


os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

os.makedirs(
    TEMP_FOLDER,
    exist_ok=True
)


ALLOWED_EXTENSIONS = {

    "pdf",

    "png",

    "jpg",

    "jpeg"

}


def allowed_file(filename):

    return (

        "." in filename

        and

        filename.rsplit(
            ".",
            1
        )[1].lower()

        in ALLOWED_EXTENSIONS

    )



@app.route("/ocr", methods=["POST"])

def ocr():


    print("================================")
    print("OCR SERVICE DIMULAI")


    if "file" not in request.files:

        print("FILE TIDAK DITEMUKAN")


        return jsonify({

            "success": False,

            "message": "File tidak ditemukan"

        }), 400



    file = request.files["file"]


    print(
        "Nama File:",
        file.filename
    )


    if file.filename == "":

        return jsonify({

            "success": False,

            "message": "Nama file kosong"

        }), 400



    if not allowed_file(file.filename):

        print(
            "FORMAT TIDAK DIDUKUNG:",
            file.filename
        )


        return jsonify({

            "success": False,

            "message": "Format file tidak didukung"

        }), 400



    extension = (

        file.filename

        .rsplit(".", 1)[1]

        .lower()

    )


    unique_name = (

        str(uuid.uuid4())

        +

        "."

        +

        extension

    )


    file_path = os.path.join(

        UPLOAD_FOLDER,

        unique_name

    )


    file.save(file_path)


    print(
        "FILE DISIMPAN:",
        file_path
    )


    full_text = ""



    # =====================================
    # PDF
    # =====================================

    if extension == "pdf":


        print(
            "MEMPROSES PDF..."
        )


        pages = convert_from_path(
            file_path
        )


        for i, page in enumerate(pages):


            image_path = os.path.join(

                TEMP_FOLDER,

                f"page_{i}.png"

            )


            page.save(

                image_path,

                "PNG"

            )


            print(

                "OCR PAGE:",

                i + 1

            )


            text = extract_text(

                image_path

            )


            full_text += text

            full_text += "\n"



    # =====================================
    # IMAGE
    # =====================================

    else:


        print(
            "MEMPROSES IMAGE..."
        )


        text = extract_text(

            file_path

        )


        full_text += text



    # =====================================
    # CEK HASIL OCR
    # =====================================


    print(
        "================================"
    )

    print(
        "HASIL RAW OCR:"
    )

    print(
        full_text
    )

    print(
        "================================"
    )



    if not full_text.strip():


        return jsonify({

            "success": False,

            "message":
                "OCR tidak berhasil membaca teks dari invoice"

        }), 400



    # =====================================
    # AI PARSER
    # =====================================


    print(
        "MENGIRIM HASIL OCR KE AI..."
    )


    data = parse_with_ai(

        full_text

    )



    data["raw_text"] = (

        full_text

    )


    data["success"] = True



    print(
        "================================"
    )

    print(
        "AI RESULT:"
    )

    print(
        data
    )

    print(
        "================================"
    )


    return jsonify(data)



if __name__ == "__main__":

    app.run(
    host="127.0.0.1",
    port=5000,
    debug=False
)