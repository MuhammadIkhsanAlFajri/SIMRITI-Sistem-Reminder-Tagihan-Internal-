import json
import requests
import re


SYSTEM_PROMPT = """
Kamu adalah sistem ekstraksi data invoice.

Tugas kamu adalah membaca teks invoice dan
mengembalikan data dalam format JSON.

JANGAN menjelaskan apa pun.
JANGAN menggunakan markdown.
JANGAN menambahkan teks lain.

Kembalikan JSON dengan format:

{
    "vendor": "",
    "invoice_name": "",
    "invoice_number": "",
    "amount": "",
    "invoice_date": "",
    "due_date": ""
}

ATURAN PENTING:

1. vendor

Vendor adalah perusahaan atau pihak
yang menerbitkan invoice.

JANGAN mengambil nama customer.

Jika tidak ditemukan, isi "".


2. invoice_name

Ambil judul tagihan atau jenis tagihan.

Jika terdapat judul seperti:

TAGIHAN INTERNET
PEMBAYARAN LISTRIK
SEWA GEDUNG

gunakan judul tersebut.

Jika hanya terdapat kata INVOICE,
buat:

Invoice {vendor}

Contoh:

Invoice PT ABC


3. invoice_number

Ambil nomor invoice secara lengkap.

Contoh:

INV/2026/001
INV-2026-001
INVOICE-12345

Jangan mengubah karakter.


4. amount

Ambil HANYA TOTAL AKHIR.

Prioritas:

Grand Total
Total Tagihan
Total Pembayaran
Total Invoice
Amount Due
Total

JANGAN mengambil:

Subtotal
PPN
Harga Satuan
Jumlah Item

Amount harus berupa angka saja.

Contoh:

Rp 6.160.500

menjadi:

6160500


5. invoice_date

Ambil tanggal invoice.

Format WAJIB:

YYYY-MM-DD


6. due_date

Ambil tanggal jatuh tempo.

Format WAJIB:

YYYY-MM-DD

Jika tidak ditemukan:

""


7. Jika informasi tidak ditemukan

Gunakan:

""

Jangan mengarang data.

Jangan menebak.

Jangan membuat data yang tidak terdapat
pada teks invoice.
"""


def clean_json_response(result):


    result = result.strip()


    # hapus markdown

    result = result.replace(
        "```json",
        ""
    )


    result = result.replace(
        "```",
        ""
    )


    result = result.strip()


    return result


# =====================================================
# NORMALISASI AMOUNT
# =====================================================

def normalize_amount(value):


    if value is None:

        return ""


    value = str(value)


    # ambil angka

    numbers = re.sub(
        r"[^0-9]",
        "",
        value
    )


    return numbers


# =====================================================
# NORMALISASI TEXT
# =====================================================

def clean_text(value):


    if value is None:

        return ""


    return str(value).replace(
        "\n",
        " "
    ).strip()


# =====================================================
# VALIDASI TANGGAL
# =====================================================

def clean_date(value):


    if value is None:

        return ""


    value = str(value).strip()


    if value.lower() in [

        "none",

        "null",

        "-",

        ""

    ]:

        return ""


    # sudah format YYYY-MM-DD

    if re.match(
        r"^\d{4}-\d{2}-\d{2}$",
        value
    ):

        return value


    return value


# =====================================================
# PARSE AI
# =====================================================

def parse_with_ai(text):


    payload = {

        "model": "gemma3:4b",


        "prompt":

            SYSTEM_PROMPT

            +

            "\n\n"

            +

            "TEXT INVOICE:\n"

            +

            text,


        "stream": False,


        # PAKSA JSON

        "format": "json",


        "options": {

            "temperature": 0

        }

    }


    response = requests.post(

        "http://127.0.0.1:11434/api/generate",

        json=payload,

        timeout=120

    )


    response.raise_for_status()


    response_data = response.json()


    result = response_data.get(

        "response",

        ""

    )


    print("")
    print("========== RAW GEMMA ==========")
    print(result)
    print("========== END GEMMA ==========")
    print("")


    # =============================================
    # CLEAN RESPONSE
    # =============================================

    result = clean_json_response(
        result
    )


    # =============================================
    # PARSE JSON
    # =============================================

    try:

        data = json.loads(
            result
        )


    except json.JSONDecodeError:


        # fallback

        match = re.search(

            r"\{[\s\S]*\}",

            result

        )


        if not match:

            raise Exception(

                "AI tidak mengembalikan JSON.\n\n"

                +

                result

            )


        data = json.loads(

            match.group()

        )


    # =============================================
    # PASTIKAN FIELD ADA
    # =============================================

    result_data = {


        "vendor":

            clean_text(
                data.get(
                    "vendor",
                    ""
                )
            ),


        "invoice_name":

            clean_text(
                data.get(
                    "invoice_name",
                    ""
                )
            ),


        "invoice_number":

            clean_text(
                data.get(
                    "invoice_number",
                    ""
                )
            ),


        "amount":

            normalize_amount(
                data.get(
                    "amount",
                    ""
                )
            ),


        "invoice_date":

            clean_date(
                data.get(
                    "invoice_date",
                    ""
                )
            ),


        "due_date":

            clean_date(
                data.get(
                    "due_date",
                    ""
                )
            )

    }


    print("")
    print("========== FINAL JSON ==========")
    print(
        json.dumps(
            result_data,
            indent=4
        )
    )
    print("================================")


    return result_data