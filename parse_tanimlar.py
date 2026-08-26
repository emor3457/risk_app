import json

with open('tanimlar.txt', 'r', encoding='utf-8') as f:
    lines = [line.strip() for line in f.read().splitlines() if line.strip()]

tehlikeler = []
riskler = []
mevzuatlar = []

# Find where 'İlgili Mevzuat' starts
mevzuat_idx = -1
for i, line in enumerate(lines):
    if line == 'İlgili Mevzuat':
        mevzuat_idx = i
        break

# Parse Mevzuat (everything after 'İlgili Mevzuat')
if mevzuat_idx != -1:
    mevzuatlar = lines[mevzuat_idx+1:]
    
    # Parse Tehlike ve Riskler (between line 1 and mevzuat_idx)
    # The pdf extracted text often puts things line by line, but it might be intermixed.
    # To keep it simple, since the user wants the AI to use these words, we don't strictly need to separate 
    # Tehlike and Risk perfectly. The AI can infer which is which if we just provide a combined list, or we just provide the raw lines.
    # Actually, we can just grab all lines from index 1 to mevzuat_idx, and split them if there's a clear boundary, 
    # but the AI is smart enough to pick the right term if we just give it the lists.
    # Let's try a heuristic: if a line is short, maybe it's one term. Let's just group them into a 'Tehlike ve Risk Terimleri' list.
    
    raw_terms = lines[1:mevzuat_idx]
    
    # Generate the JS file content
    js_content = f"""// Bu dosya tanimlar.pdf dosyasindan otomatik uretilmistir.
export const TANIMLAR = {{
    TERIMLER: {json.dumps(raw_terms, ensure_ascii=False, indent=4)},
    MEVZUATLAR: {json.dumps(mevzuatlar, ensure_ascii=False, indent=4)}
}};
"""
    with open('js/tanimlar.js', 'w', encoding='utf-8') as out_f:
        out_f.write(js_content)
    print("js/tanimlar.js created successfully.")
