#!/usr/bin/env python3
import sys
import time
import signal

FLAG = "ARKAV{s3l4MaT_k4Mu_gAk_jAd1_m4suk_BaR4K_KDMKDMKDMKDMKDMKDMKDMKDMKDM}"
TIMEOUT_SECONDS = 120

CHALLENGE_FLOW = [
    {
        "question": "Q1: What is the name of the compromised coding project folder?",
        "answer": "barak.com" 
    },
    {
        "question": "Q2: What is the nickname of the hacker?",
        "answer": "AsepKasep1284"
    },
    {
        "question": "Q3: What is the name of the malware library installed by KDM?",
        "answer": "focuslog"
    },
    {
        "question": "Q4: The hacker seems to be smart in covering his trace.\nWhat is the full SHA hash of the commit where the malicious code was added",
        "answer": "804516de087a7ddb958fd9f3b9d8258008fbff76"
    },
    {
        "question": "Q5: What is the url used by the hacker to upload files from KDM's computer?\nExample: http://localhost:3000",
        "answer": "http://182.253.124.172:5000/upload"
    },
    {
        "question": "Q6: What is the password of KDM's MetaMask vault?",
        "answer": "616b7563696e74616b646d"
    },
    {
        "question": "Q7: What is the 12-word mnemonic phrase extracted from the decrypted vault?",
        "answer": "reject hollow omit truck prison patch bargain file near draft valve purse"
    }
]

def timeout_handler(signum, frame):
    print("\n\n[!] Time's up! Connection closed.")
    sys.exit(1)

def flush_print(text):
    print(text)
    sys.stdout.flush()

def main():
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(TIMEOUT_SECONDS)

    flush_print("KDM's machine has been compromised. Trace the attacker's steps.")
    flush_print("Answer all questions correctly to receive the flag.\n")

    for i, step in enumerate(CHALLENGE_FLOW):
        flush_print(step["question"])
        
        try:
            user_input = input("\nAnswer > ").strip().lower()
        except EOFError:
            sys.exit(0)
            
        if user_input == step["answer"].lower():
            flush_print("[+] Correct.\n")
            #time.sleep(0.5)
        else:
            flush_print("\n[-] INCORRECT ANSWER.")
            flush_print("[-] Incident Response failed. Connection terminated.")
            sys.exit(0)

    flush_print("ALL PHASES COMPLETE. INCIDENT RESOLVED.")
    flush_print(f"Here is your flag: {FLAG}")

if __name__ == "__main__":
    main()