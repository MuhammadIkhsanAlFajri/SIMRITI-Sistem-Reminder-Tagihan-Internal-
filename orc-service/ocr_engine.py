import easyocr
import cv2


reader = easyocr.Reader(

    ['en'],

    gpu=False

)


def preprocess(img):


    gray = cv2.cvtColor(

        img,

        cv2.COLOR_BGR2GRAY

    )


    # perbesar image

    gray = cv2.resize(

        gray,

        None,

        fx=2,

        fy=2,

        interpolation=cv2.INTER_CUBIC

    )


    # kurangi noise

    gray = cv2.GaussianBlur(

        gray,

        (3, 3),

        0

    )


    # threshold

    _, gray = cv2.threshold(

        gray,

        0,

        255,

        cv2.THRESH_BINARY

        +

        cv2.THRESH_OTSU

    )


    return gray


def extract_text(image_path):


    img = cv2.imread(
        image_path
    )


    if img is None:

        raise Exception(

            "Gambar tidak dapat dibaca"

        )


    img = preprocess(
        img
    )


    result = reader.readtext(

        img,

        detail=0,

        paragraph=False

    )


    return "\n".join(
        result
    )