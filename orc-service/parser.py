import re

def parse_invoice(text):

    data = {
        "vendor": "",
        "invoice_name": "",
        "invoice_number": "",
        "amount": "",
        "invoice_date": "",
        "due_date": ""
    }

    # ==========================
    # Vendor
    # ==========================

    lines = text.split("\n")

    for line in lines:

        line = line.strip()

        if len(line) > 3:

            data["vendor"] = line

            break

    # ==========================
    # Nominal
    # ==========================

    amount = re.search(
        r"Rp\.?\s?[\d\.,]+",
        text,
        re.IGNORECASE
    )

    if amount:

        data["amount"] = (
            amount.group()
            .replace("Rp", "")
            .replace(".", "")
            .replace(",", "")
            .strip()
        )

    # ==========================
    # Invoice Number
    # ==========================

    inv = re.search(
        r"(INV[- ]?\d+|Invoice\s*No\.?\s*:?\s*\S+)",
        text,
        re.IGNORECASE
    )

    if inv:

        data["invoice_number"] = inv.group()

    # ==========================
    # Semua tanggal
    # ==========================

    dates = re.findall(

        r"\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2}",

        text

    )

    if len(dates) >= 1:

        data["invoice_date"] = dates[0]

    if len(dates) >= 2:

        data["due_date"] = dates[1]

    # ==========================
    # Judul Invoice
    # ==========================

    if data["vendor"]:

        data["invoice_name"] = f"Tagihan {data['vendor']}"

    return data