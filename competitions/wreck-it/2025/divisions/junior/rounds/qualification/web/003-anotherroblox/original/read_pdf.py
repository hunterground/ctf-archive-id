#!/usr/bin/env python3
import PyPDF2
import sys

def read_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            print(f"PDF berhasil dibuka! Jumlah halaman: {len(reader.pages)}")
            print("=" * 60)
            
            for page_num, page in enumerate(reader.pages, 1):
                print(f"\n--- HALAMAN {page_num} ---")
                text = page.extract_text()
                if text.strip():
                    print(text)
                else:
                    print("(Halaman ini tidak memiliki teks yang dapat diekstrak)")
                print("-" * 40)
                
    except Exception as e:
        print(f"Error membaca PDF: {e}")

if __name__ == "__main__":
    pdf_path = "LockTalk-1.pdf"
    print(f"Membaca file: {pdf_path}")
    read_pdf(pdf_path)