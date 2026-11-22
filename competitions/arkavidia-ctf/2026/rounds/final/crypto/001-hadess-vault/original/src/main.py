# fyi: remote python is 3.12

# ==================== Libraries Imports ====================
from Crypto.Util.number import long_to_bytes
from dataclasses import dataclass
from hashlib import sha256
import signal
import os ; import random ; random.seed(os.urandom(12)) # azuketto style

# ==================== Module Imports ====================
from hades import HADES
from banner import banner

REGISTER_LIMIT = 3
LOGIN_LIMIT = 10

@dataclass
class Account:
    hashed_password: str
    is_sensitive: bool = False

def get_bytes(n : int) :
    return long_to_bytes(random.getrandbits(8 * n), n)

def hash(x : str) :
    return sha256(salt + x.encode()).hexdigest()

def init() :
    global k1, k2, salt, cipher, database, register_count, login_count
    k1 = get_bytes(16)
    k2 = get_bytes(16)
    salt = get_bytes(16)
    cipher = HADES(k1, k2)
    assert cipher.decrypt(cipher.encrypt(b"ETYNSO_TEST_VAL_")) == b"ETYNSO_TEST_VAL_", "Bad Key, Try Again!"
    database = {}
    register_count = 0
    login_count = 0

def register() :
    global register_count

    if register_count >= REGISTER_LIMIT : print(f"Account Creation Failed: Only {REGISTER_LIMIT} Account per Device") ; return
    register_count += 1

    enc_id = bytes.fromhex(input("Encrypted ID: "))

    if len(enc_id) != 32 : print("Invalid ID Length") ; return
    if enc_id in database : print("Account Creation Failed: ID Already Exists") ; return
    
    password = input("Password: ")
    database[enc_id] = Account(hashed_password = hash(password))

def login() :
    global login_count

    if login_count >= LOGIN_LIMIT : print(f"Login Failed: Only {LOGIN_LIMIT} Login Attempts per Device") ; return
    login_count += 1

    enc_id = bytes.fromhex(input("Encrypted ID: "))

    if len(enc_id) != 32 : print("Invalid ID Length") ; return
    if enc_id not in database : print("Login Failed: ID Not Found") ; return

    account = database[enc_id]
    password = input("Password: ")
    hashed_pwd = hash(password)

    if hashed_pwd != account.hashed_password : print("Login Failed: Wrong Password") ; return

    print("Login Success, Feel Free to Use Our Service!")

    if cipher.decrypt(enc_id) == b"GG goat, see u in Arkavidia 11.0" :
        print(open('flag.txt', 'r').read())

    exit(0)

def send_creds(enc_id : str, password : str) :
    # TODO: Send credentials to employee emails
    pass

def batch_create() :
    num = int(input("Employee Count: "))

    if len(database) + num > 300 :
        print("Database Overload")
        return

    for _ in range(num) :
        id = get_bytes(32)
        enc_id = cipher.encrypt(id)
        password = bytes([e ^ i ^ k for e, i, k in zip(enc_id, id, k1 + k2)]).hex()
        if enc_id not in database :
            database[enc_id] = Account(hashed_password = hash(password))
        database[enc_id].is_sensitive = True
        send_creds(enc_id.hex(), password)

def check_db() :
    print("Dumping DB")
    print(database)

def menu() :
    print("[1] Register")
    print("[2] Login")
    print("[3] Create Employee Emails")
    print("[4] Check Database")
    return int(input("[+] Option : "))

def main() :
    print(banner)
    init()
    while True :
        [exit, register, login, batch_create, check_db, exit][menu()]()

class TimeoutException(Exception):
    pass

def signal_handler(signum, frame):
    raise TimeoutException()

signal.signal(signal.SIGALRM, signal_handler)

if __name__ == "__main__" :
    signal.alarm(60 * 60 * 10)
    try :
        main()
    except TimeoutException as ex :
        print("Free Flag!")
        print(open('flag.txt', 'r').read()) # Free Flag :D
    except Exception as ex :
        print(ex) # side channel :D