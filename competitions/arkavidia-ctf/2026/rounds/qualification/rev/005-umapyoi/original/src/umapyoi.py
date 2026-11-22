import struct
import os

# ==============================================================================
# CONFIGURATION SECTION
# ==============================================================================

FILENAME = "./dots"

# 1. THE NEW FLAG
NEW_FLAG =  "ARKAV{09ur1_d_b3_7r4v3r51n9_1n_m3}"

# 2. THE TEXT MESSAGES

# [A] Victory Message
NEW_VIC  = ""

# [B] Flag Prefix
NEW_PFX  = "FLAG: " 

# [C] Intro Message
NEW_MSG1 = "I'm going to win this for the folks back home. But first, food."

# [D] Question Message
ADDR_MSG2 = 0x5810c8
NEW_MSG2  = "Insert flag: " 

# [E] Lose Message
ADDR_LOSE_SHORT = 0x5810c8 + 44  # 0x5810F4
NEW_LOSE_SHORT  = ""             

ADDR_LOSE_MAIN  = 0x5810c8 + 48  # 0x5810F8
NEW_LOSE_MAIN   = "\nYour trainee lacks guts." 

# [F] Whitelist
ADDR_CHARSET  = 0x581040
LIMIT_CHARSET = 27

# ==============================================================================
# EXECUTION LOGIC
# ==============================================================================

PATH_NODES = [
    632, 947, 546, 726, 374, 584, 599, 749, 169, 793, 
    844, 340, 392, 650, 808, 368, 943, 315, 400, 713, 
    209, 779, 672, 884, 934, 373, 111, 435, 840, 408, 
    921, 66,  517, 715
]

ADDR_FLAG_DATA = 0x588f00 
ADDR_VIC       = 0x58105c
ADDR_PFX       = 0x581072
ADDR_MSG1      = 0x581080
LOAD_BASE      = 0x400000 

LIMIT_VIC  = 21
LIMIT_PFX  = 13
LIMIT_MSG1 = 63
LIMIT_MSG2 = 43
LIMIT_LOSE_SHORT = 3
LIMIT_LOSE_MAIN = 30             

def patch_string(f, virtual_addr, new_string, max_len, desc):
    encoded = new_string.encode('utf-8')
    if len(encoded) > max_len:
        print(f"[-] Warning: '{desc}' is too long! Truncating.")
        encoded = encoded[:max_len]
        encoded = encoded.decode('utf-8', 'ignore').encode('utf-8')

    file_offset = virtual_addr - LOAD_BASE
    
    write_buffer = encoded.ljust(max_len + 1, b'\x00')
    write_buffer = write_buffer[:max_len+1] 
    
    print(f"[*] Patching {desc} @ {hex(file_offset)}...")
    f.seek(file_offset)
    f.write(write_buffer)

def main():
    if not os.path.exists(FILENAME):
        print("[-] File not found.")
        return

    print(f"[*] Opening {FILENAME} for patching...")
    with open(FILENAME, 'r+b') as f:
        # 1. Patch Flag Path
        for i, char in enumerate(NEW_FLAG):
            node_id = PATH_NODES[i]
            offset = (ADDR_FLAG_DATA - LOAD_BASE) + (node_id * 8) + 4
            f.seek(offset)
            f.write(char.encode('utf-8'))

        # 2. Update Whitelist
        unique_chars = sorted(list(set(NEW_FLAG)))
        whitelist_str = "".join(unique_chars)
        print(f"[*] Whitelist: {whitelist_str}")
        patch_string(f, ADDR_CHARSET, whitelist_str, LIMIT_CHARSET, "Charset")

        # 3. Patch Messages
        patch_string(f, ADDR_VIC,  NEW_VIC,  LIMIT_VIC,  "Victory Message")
        patch_string(f, ADDR_PFX,  NEW_PFX,  LIMIT_PFX,  "Flag Prefix")
        patch_string(f, ADDR_MSG1, NEW_MSG1, LIMIT_MSG1, "Intro Message")
        patch_string(f, ADDR_MSG2, NEW_MSG2, LIMIT_MSG2, "Question Message")
        
        # 4. Patch Lose Messages
        patch_string(f, ADDR_LOSE_SHORT, NEW_LOSE_SHORT, LIMIT_LOSE_SHORT, "Lose Msg (Short)")
        patch_string(f, ADDR_LOSE_MAIN,  NEW_LOSE_MAIN,  LIMIT_LOSE_MAIN,  "Lose Msg (Main)")

if __name__ == "__main__":
    main()
