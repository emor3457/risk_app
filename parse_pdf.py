import pdfplumber
import json

tehlikeler = set()
riskler = set()
mevzuatlar = set()

with pdfplumber.open("tanimlar.pdf") as pdf:
    # We don't know the exact layout, but tables are good.
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            for row in table:
                if not row: continue
                # Depending on how the table is structured
                print(row)
