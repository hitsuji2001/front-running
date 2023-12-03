from web3 import Web3

web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/5ab7aa5ac4eb4c99b6c877edd679843e'))
block = web3.eth.get_block('latest')
toFromPairs = {}
transactionCount = {}

# Grab our Transactions and thier transaction hashes
if block and block.transactions: 
    for transaction in block.transactions: 
        tx_hash = transaction.hex() # Convert txhashes from hexBytes format
        tx = web3.eth.get_transaction(tx_hash)

# Check if To/From pairs exist and update count        
        if tx.to != None:
            if tx.to in toFromPairs:
                if toFromPairs[tx.to] == tx["from"]:
                    transactionCount[tx.to] = transactionCount[tx.to] + 1 

# Start a running count on any new To addresses and create a to/from pair               
            elif tx.to not in toFromPairs:
                transactionCount[tx.to] = 1
                toFromPairs[tx.to] = tx["from"]


# Print all pairs with exactly 2 transactions in a single block for manual review
for key, value in transactionCount.items():
    if value == 2:
        print(toFromPairs[key])
