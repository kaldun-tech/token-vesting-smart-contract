package contracts

import (
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
)

// TokenVestingMetaData contains the ABI for the TokenVesting contract
var TokenVestingMetaData = &bind.MetaData{
	ABI: `[
		{
			"inputs": [{"internalType": "address", "name": "beneficiary", "type": "address"}],
			"name": "vestingSchedules",
			"outputs": [
				{"internalType": "address", "name": "beneficiary", "type": "address"},
				{"internalType": "uint256", "name": "start", "type": "uint256"},
				{"internalType": "uint256", "name": "cliff", "type": "uint256"},
				{"internalType": "uint256", "name": "duration", "type": "uint256"},
				{"internalType": "uint256", "name": "amount", "type": "uint256"},
				{"internalType": "uint256", "name": "released", "type": "uint256"},
				{"internalType": "bool", "name": "revocable", "type": "bool"},
				{"internalType": "bool", "name": "revoked", "type": "bool"}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "address", "name": "beneficiary", "type": "address"}],
			"name": "vestedAmount",
			"outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "internalType": "address", "name": "beneficiary", "type": "address"},
				{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
				{"indexed": false, "internalType": "uint256", "name": "start", "type": "uint256"},
				{"indexed": false, "internalType": "uint256", "name": "cliff", "type": "uint256"},
				{"indexed": false, "internalType": "uint256", "name": "duration", "type": "uint256"}
			],
			"name": "VestingScheduleCreated",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "internalType": "address", "name": "beneficiary", "type": "address"},
				{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
			],
			"name": "TokensReleased",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{"indexed": true, "internalType": "address", "name": "beneficiary", "type": "address"},
				{"indexed": false, "internalType": "uint256", "name": "refunded", "type": "uint256"}
			],
			"name": "VestingRevoked",
			"type": "event"
		}
	]`,
}

// VestingSchedule represents the smart contract struct
type VestingSchedule struct {
	Beneficiary common.Address
	Start       *big.Int
	Cliff       *big.Int
	Duration    *big.Int
	Amount      *big.Int
	Released    *big.Int
	Revocable   bool
	Revoked     bool
}

// Event structs
type TokenVestingVestingScheduleCreated struct {
	Beneficiary common.Address
	Amount      *big.Int
	Start       *big.Int
	Cliff       *big.Int
	Duration    *big.Int
}

type TokenVestingTokensReleased struct {
	Beneficiary common.Address
	Amount      *big.Int
}

type TokenVestingVestingRevoked struct {
	Beneficiary common.Address
	Refunded    *big.Int
}

// TokenVesting represents the contract interface
type TokenVesting struct {
	address common.Address
	caller  bind.ContractCaller
}

// NewTokenVesting creates a new instance of the contract
func NewTokenVesting(address common.Address, backend bind.ContractBackend) (*TokenVesting, error) {
	return &TokenVesting{
		address: address,
		caller:  backend,
	}, nil
}

// VestingSchedules retrieves a vesting schedule
func (tv *TokenVesting) VestingSchedules(opts *bind.CallOpts, beneficiary common.Address) (VestingSchedule, error) {
	var out VestingSchedule
	// This is a simplified version - in production, use abigen-generated bindings
	// For now, return empty struct - will be implemented with full bindings
	return out, nil
}

// VestedAmount gets the vested amount for a beneficiary
func (tv *TokenVesting) VestedAmount(opts *bind.CallOpts, beneficiary common.Address) (*big.Int, error) {
	// This is a simplified version - in production, use abigen-generated bindings
	return big.NewInt(0), nil
}
