def main():
    qa_list = [
        {"question": "Repositori yang digunakan threat actor", "format": "https://example/path/to/repo", "answer": "https://github.com/walawe1337-oss/simple-python-server"},
        {"question": "Hash MD5 file yang bersifat malicious (Lower case)", "format": "-", "answer": "11e128c2bf2f82f4e966a0ec2ff072bb"},
        {"question": "Key and IV yang digunakan untuk enkripsi", "format": "key:iv", "answer": "this_is_my_secret_aes_256_key!!!:abcdef1234567890"},
        {"question": "IP dan port yang digunakan oleh penyerang", "format": "ip:port", "answer": "165.232.133.53:12311"},
        {"question": "Perintah yang dieksekusi threat actor", "format": "-", "answer": "echo \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICUHM+DTrehpFANzpOzDPUJi1DYaK1xwMpMLz1QqwxJ0 kali@kali\" >> /root/.ssh/authorized_keys"},
        {"question": "Teknik MITRE ATT&CK berdasarkan pertanyaan sebelumnya", "format": "T12345.123", "answer": "T1098.004"}
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
        print("\nCongrats! Flag: GEMASTIK18{5230e7b97ebd5d1a23d956aae28fbb9d}")

if __name__ == "__main__":
    main()