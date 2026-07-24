import pdfplumber
import json
import re

tehlikeler = set()
riskler = set()
mevzuatlar = set()

is_mevzuat = False

def clean_text(t):
    if not t: return ""
    return re.sub(r'\s+', ' ', str(t).strip())

with pdfplumber.open("tanimlar.pdf") as pdf:
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            for row in table:
                if not row or not row[0]: continue
                val0 = clean_text(row[0])
                
                if val0 == 'İlgili Mevzuat':
                    is_mevzuat = True
                    continue
                if val0 == 'Tehlike Adı':
                    continue
                    
                if is_mevzuat:
                    if val0: mevzuatlar.add(val0)
                else:
                    if val0: tehlikeler.add(val0)
                    if len(row) > 1 and row[1]:
                        val1 = clean_text(row[1])
                        if val1 and val1 != 'Risk Adı':
                            riskler.add(val1)

# Generate JS
js_content = f"""// Bu dosya tanimlar.pdf dosyasindan otomatik uretilmistir.
export const TANIMLAR = {{
    TEHLIKE_KAYNAKLARI: {json.dumps(sorted(list(tehlikeler)), ensure_ascii=False, indent=4)},
    RISKLER: {json.dumps(sorted(list(riskler)), ensure_ascii=False, indent=4)},
    MEVZUATLAR: {json.dumps(sorted(list(mevzuatlar)), ensure_ascii=False, indent=4)}
}};
"""
with open('js/tanimlar.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
