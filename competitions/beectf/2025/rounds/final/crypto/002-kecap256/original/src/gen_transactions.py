from wallet import *
import random
from eth_keys import keys
import os
import json

def main():
    raw = os.urandom(32)
    d = int.from_bytes(raw, 'big')
    print(f'private key: {hex(d)}')

    txs = []
    from_addr = keys.PrivateKey(raw).public_key.to_checksum_address()
    for i in range(10):
        types = ["string", "uint256"]
        values = [f"tx{i}", i]

        # sign message as in the challenge
        v, r, s = generate_signature(d, types, values)

        # compute message hash used by signature (32 bytes)
        inner = kecap_enc(types, values)
        z = hash(inner)
        tx_hash = "0x" + z.to_bytes(32, "big").hex()

        block_hash = "0x" + os.urandom(32).hex()
        block_number = random.randint(20_000_000, 30_000_000)
        to_addr = "0x" + os.urandom(20).hex()
        tx_index = random.randint(0, 400)
        gas_limit = 21000
        max_fee_per_gas = random.randint(1, 200_000_000)
        effective_gas_price = max_fee_per_gas
        max_priority_fee_per_gas = 0
        nonce = i + 1
        value = random.randint(1, 10**18)
        y_parity = v - 27

        tx_obj = {
            "blockHash": block_hash,
            "blockNumber": block_number,
            "from": from_addr,
            "transactionIndex": tx_index,
            "effectiveGasPrice": effective_gas_price,
            "accessList": [],
            "chainId": 42161,
            "gasLimit": gas_limit,
            "hash": tx_hash,
            "input": "0x",
            "maxFeePerGas": max_fee_per_gas,
            "maxPriorityFeePerGas": max_priority_fee_per_gas,
            "nonce": nonce,
            "r": hex(r),
            "s": hex(s),
            "to": to_addr,
            "type": 2,
            "value": value,
            "yParity": y_parity,
        }
        txs.append(tx_obj)
    with open("transactions.json", "w") as f:
        json.dump(txs, f, indent=2)
    print("transactions.json")

if __name__ == "__main__":
    main()