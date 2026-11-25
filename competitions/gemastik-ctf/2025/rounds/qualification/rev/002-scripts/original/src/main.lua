ops = {"j3s5l", "j3s5l", "m9kp2", "qwx7z", "qwx7z", "m9kp2", "j3s5l", "j3s5l", "qwx7z", "j3s5l", "j3s5l", "qwx7z", "m9kp2", "j3s5l", "qwx7z", "j3s5l", "m9kp2", "j3s5l", "j3s5l", "m9kp2", "m9kp2", "qwx7z", "j3s5l", "m9kp2", "j3s5l", "m9kp2", "m9kp2", "j3s5l", "m9kp2", "qwx7z", "qwx7z", "qwx7z", "qwx7z"}
k = {143, 193, 38, 93, 97, 13, 149, 22, 102, 163, 38, 84, 55, 157, 130, 12, 65, 133, 194, 3, 9, 162, 198, 41, 77, 20, 55, 76, 17, 192, 207, 104, 163}

-- decrypt, loop through ct and k, and use the INVERSE ops to decrypt the ct
-- flag = ""
-- for i = 1, #ct do
--     local op_name = ops[i]
--     local encrypted_val = ct[i]
--     local key_val = k[i]
--     local result = 0
    
--     -- Handle large numbers as signed 32-bit integers
--     if encrypted_val > 2147483647 then
--         encrypted_val = encrypted_val - 4294967296
--     end
    
--     -- Debug output
--     -- print(string.format("i=%d, op=%s, enc=%d, key=%d", i, op_name, encrypted_val, key_val))
    
--     -- Call the INVERSE operation to decrypt
--     if op_name == "qwx7z" then       -- add -> subtract
--         result = encrypted_val - key_val
--     elseif op_name == "m9kp2" then   -- subtract -> add
--         result = encrypted_val + key_val
--     elseif op_name == "j3s5l" then   -- xor -> xor (self-inverse)
--         result = encrypted_val ~ key_val  -- XOR in Lua
--     end
    
--     -- Handle negative results
--     while result < 0 do
--         result = result + 256
--     end
    
--     -- Keep in byte range
--     result = result % 256
    
--     -- Convert to character
--     if result >= 0 and result <= 255 then
--         flag = flag .. string.char(result)
--     end
-- end

-- print("Decrypted flag: " .. flag)

-- pt = "GEMASTIK18{ez_scripting_language}"
pt = "*********************************"
ct = {200, 132, 39, 158, 180, 71, 220, 93, 151, 155, 93, 185, 67, 194, 245, 111, 49, 236, 178, 113, 96, 272, 161, 54, 33, 77, 55, 43, 100, 289, 310, 205, 288}

-- encrypt pt using the ops and k and compare with ct
for i = 1, #pt do
    local op_name = ops[i]
    local key_val = k[i]
    local char_code = string.byte(pt, i)  -- Get ASCII value of character at position i
    local result = 0
    
    -- Apply the same operations as in generate_flag.py
    if op_name == "qwx7z" then          -- add
        result = qwx7z(char_code, key_val)
    elseif op_name == "m9kp2" then      -- subtract
        result = m9kp2(char_code, key_val)
    elseif op_name == "j3s5l" then      -- xor
        result = j3s5l(char_code, key_val)
    end
    
    
    if result ~= ct[i] then
        print("WRONG")
        os.exit(1)
    end
end

print("CORRECT")