# NeuralCipher - Reverse Engineering Challenge

## Challenge Overview

**Category:** Reverse Engineering  
**Difficulty:** Medium to Hard  
**Points:** 1000 (dynamic)  
**Flag:** `ARKAV{m4tr1x_m0dul0_m4yhem_1nv3rt1bl3_n3ur4l_c1ph3r}`

## Description

This challenge implements a "Reversible Neural Network" cipher that disguises a mathematical linear transformation as an AI/neural network operation. Players must reverse engineer the encryption scheme and understand modular matrix inversion to recover the flag.

## Challenge Concept

The challenge consists of two stages:

**Stage 1: File Recovery (Reverse Engineering)**
- Players are given `neural_cipher.pyc` with corrupted magic bytes.
- They must identify the file type, fix the header, and decompile it.
- This reveals the encryption logic source code.

**Stage 2: Cryptanalysis (Math)**
- The encryption logic is revealed to be:
  ```
  encrypted = (weight_matrix @ plaintext) mod 256
  ```
- Players must solve this linear system in Z/256Z.
- Standard inversion fails; they must implement modular matrix inversion.

## Educational Value

This challenge teaches:
- **File Formats:** Analyzing and fixing corrupted headers (Magic Bytes)
- **Python Bytecode:** Understanding .pyc files and decompilation
- **Linear Algebra:** Matrix operations and properties of triangular matrices
- **Modular Arithmetic:** Working in Z/256Z, modular inverses
- **Code Analysis:** Reading and understanding mathematical code


## Key Insight (Solution Approach)

- The weight matrix is strictly **upper triangular** with **odd diagonal elements**
- For upper triangular matrices, the determinant is the product of diagonal elements
- In Z/256Z, a number is invertible iff it's odd (coprime to 256)
- Inversion can be done efficiently using back-substitution rather than computing the adjugate matrix

## Files Structure

```
NeuralCipher/
├── challenge.yml          # CTF platform configuration
├── README.md             # This file
├── DISTRIBUTION.md       # Guide for creating distribution files
├── src/
│   ├── challenge_gen.py  # Challenge generation script
│   └── flag.txt          # The flag (keep secret!)
├── solver/
│   └── solve.py          # Official solution (keep secret!)
└── dist/
    ├── output.txt        # Encrypted flag (give to players)
    ├── weights.npy       # Weight matrix (give to players)
    └── README.txt        # Player-facing description (give to players)
```

## Setup Instructions

### Prerequisites
- Python 3.7+
- NumPy

### Generating the Challenge

```bash
cd src
python3 challenge_gen.py
```

This creates three files in `dist/`:
- `output.txt` - encrypted flag vector
- `weights.npy` - invertible weight matrix  
- `README.txt` - player-facing challenge description

### Testing the Solution

```bash
cd solver
python3 solve.py
```

This should correctly recover: `ARKAV{m4tr1x_m0dul0_m4yhem_1nv3rt1bl3_n3ur4l_c1ph3r}`

### Creating Distribution Package

```bash
cd dist
zip dist.zip output.txt weights.npy README.txt
```

## Challenge Design Notes

### Why This Works as a CTF Challenge

**The Trap:**
- Beginners will try `numpy.linalg.inv()` which uses floating-point arithmetic
- This fails because the cipher operates in Z/256Z (modular arithmetic)
- Even if they compute the "inverse", applying it won't recover the correct plaintext

**The Solve:**
- Players must discover the matrix is upper triangular
- Implement modular inverse computation (Extended Euclidean Algorithm)
- Use back-substitution to invert the matrix under mod 256
- Apply the inverse transformation to decrypt

### Anti-Shortcut Measures

- Matrix is large enough (52×52) that brute force is impractical
- Upper triangular structure is not immediately obvious without loading the matrix
- The "neural network" theming misdirects players unfamiliar with linear algebra
- README hints at "irreversibility" to discourage the correct approach (reverse psychology)

### Difficulty Calibration

**What makes it Medium-Hard:**
- Requires both mathematical knowledge (linear algebra, modular arithmetic)
- Requires programming skills (implementing modular matrix inversion)
- Not solvable with standard library functions alone
- Players need to research or know about modular matrix inversion

**Hints (if needed):**
1. "Standard matrix inversion uses floats. This is modular arithmetic."
2. "Upper triangular matrices are special. Look at the diagonal."
3. "Extended Euclidean Algorithm + back-substitution"

## Author

**sandwicheese** for ARKAV CTF Qualifications

## License

This challenge is for educational purposes in CTF competitions.
