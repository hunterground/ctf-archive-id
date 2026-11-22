import json
from pathlib import Path
import sandbox
from web3 import Web3

def set_balance(web3: Web3, account_address: str, amount: int):
    res = web3.provider.make_request(
        "anvil_setBalance",
        [account_address, hex(amount)]
    )
    print(f"Set balance for {account_address}: {res}")

def deploy(web3: Web3, deployer_address: str, deployer_privateKey: str, player_address: str) -> str:
    set_balance(web3, deployer_address, Web3.to_wei(10, 'ether'))
    
    json_path = Path("compiled/Setup.sol/Setup.json")
    if not json_path.exists():
        json_path = Path("out/Setup.sol/Setup.json")
    
    if not json_path.exists():
        raise Exception(f"Compiled file not found at: {json_path}")
        
    contract_info = json.loads(json_path.read_text())
    abi = contract_info["abi"]
    bytecode = contract_info["bytecode"]["object"] if "object" in contract_info["bytecode"] else contract_info["bytecode"]

    contract = web3.eth.contract(abi=abi, bytecode=bytecode)

    construct_txn = contract.constructor(player_address).build_transaction(
        {
            "from": deployer_address,
            "value": 0,
            "nonce": web3.eth.get_transaction_count(deployer_address),
            "gas": 10000000, 
            "gasPrice": web3.to_wei('10', 'gwei')
        }
    )

    tx_create = web3.eth.account.sign_transaction(construct_txn, deployer_privateKey)
    tx_hash = web3.eth.send_raw_transaction(tx_create.raw_transaction)
    rcpt = web3.eth.wait_for_transaction_receipt(tx_hash)
    
    set_balance(web3, player_address, Web3.to_wei(1, 'ether'))

    return rcpt.contractAddress

app = sandbox.run_launcher(deploy)