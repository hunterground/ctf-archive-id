def main():
    qa_list = [
        {"question": "C2 server yang digunakan (Case sensitive)", "format": "-", "answer": "TrevorC2"},
        {"question": "Key yang digunakan oleh C2 server", "format": "-", "answer": "aewfoijdc887xc6qwj21t"},
        {"question": "Perintah pertama yang dijalankan oleh C2 server", "format": "-", "answer": "whoami"},
        {"question": "URL lengkap tempat threat actor mendownload malware", "format": "http://gemastik.ctf/example/path", "answer": "http://192.168.56.102:8888/m"},
        {"question": "Jenis enkripsi yang digunakan oleh malware", "format": "-", "answer": "AES"},
        {"question": "Key yang digunakan untuk mengenkripsi file", "format": "-", "answer": "7aeaef7351e88b7a"},
        {"question": "IV yang digunakan untuk mengenkripsi file", "format": "-", "answer": "b2195af3d80ec529"},
        {"question": "Commit message yang dipush oleh threat actor", "format": "-", "answer": "remove flag hahaha"},
        {"question": "Isi asli dari file `flag`", "format": "-", "answer": "Walawe1337!!@@"}
    ]

    print("Please answer the following questions:")

    correct_answers = 0

    for index, item in enumerate(qa_list, start=1):
        print(f"\nNo {index}:")
        print("Question: " + item["question"])
        print("Format: " + item["format"])
        user_answer = input("Answer: ")

        if user_answer.strip() == item["answer"]:
            correct_answers += 1
            print("Correct")
        else:
            print("Incorrect")
            break

    if correct_answers == len(qa_list):
        print("\nCongrats! Flag: GEMASTIK18{8a0ff41679ec8dde84f47f482693f32e}")

if __name__ == "__main__":
    main()