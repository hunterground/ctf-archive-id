from z3 import *

def solve_key():
    # Create the solver
    s = Solver()

    # Enable core tracking to find conflicting constraints if UNSAT
    s.set(unsat_core=True)

    # Define the 4 segments as 32-bit BitVectors
    s1, s2, s3, s4 = BitVecs('s1 s2 s3 s4', 32)

    # --- Helper Functions ---
    def rotate_left(x, n):
        # ((x << n) | (x >>> (32 - n)))
        return (x << n) | LShR(x, 32 - n)

    def pop_count(x):
        # Sum of bits for a 32-bit vector
        # This breaks the vector into bits and sums them
        return Sum([ZeroExt(32, Extract(i, i, x)) for i in range(32)])

    # --- Constraints from KeyValidator.java ---

    # 1. XOR Check: (s1 ^ s2) != 0xD3E90A20L
    # We assert the equality for the solver to find the valid key
    s.assert_and_track((s1 ^ s2) == 0x3B13CB9F, "c1_xor_s1_s2")

    # 2. Addition Check: ((s2 + s3) & 0xFFFFFFFFL) != 0xF1E57FCDL
    # BitVec arithmetic in Z3 is implicitly mod 2^32, so we just use ==
    s.assert_and_track((s2 + s3) == 0xD37B732D, "c2_add_s2_s3")

    # 3. Multiplication Check: ((s1 * 0x1337L) & 0xFFFFFFFFL) != 0xAC0D5092L
    s.assert_and_track((s1 * 0x1337) == 0xAB26AF37, "c3_mul_s1")

    # 4. AND Check: (s3 & s4) != 0x88AD300DL
    s.assert_and_track((s3 & s4) == 0x30C20D, "c4_and_s3_s4")

    # 5. XOR Check 2: (s3 ^ s4) != 0x55004EE2L
    s.assert_and_track((s3 ^ s4) == 0xABCB21F2, "c5_xor_s3_s4")

    # 6. Rotation Check: (rotated ^ 0xDEADBEEFL) != 0x2F5E7487
    rotated_s2 = rotate_left(s2, 13)
    s.assert_and_track((rotated_s2 ^ 0xDEADBEEF) == 0x2F5E7487, "c6_rot_s2")

    # 7. Low 16-bit Sum: ((s1 + s2 + s3 + s4) & 0xFFFFL) != 0x3AD8L
    sum_all = s1 + s2 + s3 + s4
    s.assert_and_track((sum_all & 0xFFFF) == 0x79AB, "c7_sum_low16")

    # 8. PopCount Check: Long.bitCount(s1 ^ s4) != 16
    # Note: If your key is C0DECAFE... and 8BADF00D..., the popcount is actually 19.
    # This constraint is likely the cause of UNSAT if kept at 16.
    s.assert_and_track(pop_count(s1 ^ s4) == 0xF, "c8_popcount")

    # 9. High 16-bit Sum: (s1 >>> 16) + ...
    high_sum = LShR(s1, 16) + LShR(s2, 16) + LShR(s3, 16) + LShR(s4, 16)
    s.assert_and_track((high_sum & 0xFFFF) == 0x67C6, "c9_sum_high16")

    # --- Solve ---
    print("Checking constraints...")
    result = s.check()

    if result == sat:
        print("\nSUCCESS! Found a valid key:")
        m = s.model()
        key_parts = [
            f"{m[s1].as_long():08X}",
            f"{m[s2].as_long():08X}",
            f"{m[s3].as_long():08X}",
            f"{m[s4].as_long():08X}"
        ]
        print("-".join(key_parts))
    else:
        print("\nFAILED: Constraints are UNSAT (Unsatisfiable).")
        print("The following constraints conflict with each other:")
        print(s.unsat_core())
        print("\nTip: 'c4_and_s3_s4' and 'c8_popcount' are the most likely broken math constants.")

if __name__ == "__main__":
    solve_key()
