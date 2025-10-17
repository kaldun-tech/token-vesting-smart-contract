package blockchain

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/kaldun-tech/token-vesting-backend/internal/config"
	"github.com/kaldun-tech/token-vesting-backend/pkg/contracts"
)

type Client struct {
	ethClient       *ethclient.Client
	vestingContract *contracts.TokenVesting
	config          *config.Config
	contractAddress common.Address
}

// NewClient creates a new blockchain client
func NewClient(cfg *config.Config) (*Client, error) {
	// Connect to Ethereum node
	client, err := ethclient.Dial(cfg.EthereumRPC)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum node: %w", err)
	}

	// Verify connection
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	log.Printf("✅ Connected to Ethereum network (Chain ID: %s)", chainID.String())

	// Load contract
	contractAddress := common.HexToAddress(cfg.TokenVestingAddress)
	vestingContract, err := contracts.NewTokenVesting(contractAddress, client)
	if err != nil {
		return nil, fmt.Errorf("failed to load vesting contract: %w", err)
	}

	log.Printf("✅ Vesting contract loaded at %s", contractAddress.Hex())

	return &Client{
		ethClient:       client,
		vestingContract: vestingContract,
		config:          cfg,
		contractAddress: contractAddress,
	}, nil
}

// GetVestingSchedule retrieves a vesting schedule from the blockchain
func (c *Client) GetVestingSchedule(beneficiary common.Address) (*contracts.VestingSchedule, error) {
	schedule, err := c.vestingContract.VestingSchedules(nil, beneficiary)
	if err != nil {
		return nil, fmt.Errorf("failed to get vesting schedule: %w", err)
	}
	return &schedule, nil
}

// GetVestedAmount gets the vested amount for a beneficiary
func (c *Client) GetVestedAmount(beneficiary common.Address) (*big.Int, error) {
	amount, err := c.vestingContract.VestedAmount(nil, beneficiary)
	if err != nil {
		return nil, fmt.Errorf("failed to get vested amount: %w", err)
	}
	return amount, nil
}

// WatchEvents watches for contract events starting from a specific block
func (c *Client) WatchEvents(ctx context.Context, startBlock uint64, eventChan chan<- *ContractEvent) error {
	query := ethereum.FilterQuery{
		Addresses: []common.Address{c.contractAddress},
		FromBlock: big.NewInt(int64(startBlock)),
	}

	logs := make(chan types.Log)
	sub, err := c.ethClient.SubscribeFilterLogs(ctx, query, logs)
	if err != nil {
		return fmt.Errorf("failed to subscribe to logs: %w", err)
	}

	log.Printf("🔍 Watching for events from block %d", startBlock)

	go func() {
		defer sub.Unsubscribe()
		for {
			select {
			case err := <-sub.Err():
				log.Printf("❌ Event subscription error: %v", err)
				return
			case vLog := <-logs:
				event, err := c.parseEvent(vLog)
				if err != nil {
					log.Printf("⚠️  Failed to parse event: %v", err)
					continue
				}
				eventChan <- event
			case <-ctx.Done():
				log.Println("🛑 Stopping event watcher")
				return
			}
		}
	}()

	return nil
}

// FetchHistoricalEvents fetches past events in batches
func (c *Client) FetchHistoricalEvents(ctx context.Context, fromBlock, toBlock uint64) ([]*ContractEvent, error) {
	query := ethereum.FilterQuery{
		Addresses: []common.Address{c.contractAddress},
		FromBlock: big.NewInt(int64(fromBlock)),
		ToBlock:   big.NewInt(int64(toBlock)),
	}

	logs, err := c.ethClient.FilterLogs(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to filter logs: %w", err)
	}

	events := make([]*ContractEvent, 0, len(logs))
	for _, vLog := range logs {
		event, err := c.parseEvent(vLog)
		if err != nil {
			log.Printf("⚠️  Failed to parse historical event: %v", err)
			continue
		}
		events = append(events, event)
	}

	return events, nil
}

// GetLatestBlockNumber gets the latest block number
func (c *Client) GetLatestBlockNumber(ctx context.Context) (uint64, error) {
	header, err := c.ethClient.HeaderByNumber(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to get latest block: %w", err)
	}
	return header.Number.Uint64(), nil
}

// parseEvent parses a log event into our ContractEvent struct
func (c *Client) parseEvent(vLog types.Log) (*ContractEvent, error) {
	// Parse based on topic (event signature)
	contractAbi, err := abi.JSON(strings.NewReader(contracts.TokenVestingMetaData.ABI))
	if err != nil {
		return nil, err
	}

	event := &ContractEvent{
		BlockNumber:     vLog.BlockNumber,
		TransactionHash: vLog.TxHash.Hex(),
	}

	// Determine event type by topic
	switch vLog.Topics[0].Hex() {
	case contractAbi.Events["VestingScheduleCreated"].ID.Hex():
		var scheduleCreated contracts.TokenVestingVestingScheduleCreated
		err := contractAbi.UnpackIntoInterface(&scheduleCreated, "VestingScheduleCreated", vLog.Data)
		if err != nil {
			return nil, err
		}
		event.EventType = "VestingScheduleCreated"
		event.Beneficiary = common.HexToAddress(vLog.Topics[1].Hex()).Hex()
		event.Amount = scheduleCreated.Amount.String()
		event.Data = map[string]interface{}{
			"start":    scheduleCreated.Start.String(),
			"cliff":    scheduleCreated.Cliff.String(),
			"duration": scheduleCreated.Duration.String(),
		}

	case contractAbi.Events["TokensReleased"].ID.Hex():
		var tokensReleased contracts.TokenVestingTokensReleased
		err := contractAbi.UnpackIntoInterface(&tokensReleased, "TokensReleased", vLog.Data)
		if err != nil {
			return nil, err
		}
		event.EventType = "TokensReleased"
		event.Beneficiary = common.HexToAddress(vLog.Topics[1].Hex()).Hex()
		event.Amount = tokensReleased.Amount.String()

	case contractAbi.Events["VestingRevoked"].ID.Hex():
		var vestingRevoked contracts.TokenVestingVestingRevoked
		err := contractAbi.UnpackIntoInterface(&vestingRevoked, "VestingRevoked", vLog.Data)
		if err != nil {
			return nil, err
		}
		event.EventType = "VestingRevoked"
		event.Beneficiary = common.HexToAddress(vLog.Topics[1].Hex()).Hex()
		event.Amount = vestingRevoked.Refunded.String()

	default:
		return nil, fmt.Errorf("unknown event type")
	}

	return event, nil
}

// ContractEvent represents a parsed contract event
type ContractEvent struct {
	EventType       string
	Beneficiary     string
	Amount          string
	BlockNumber     uint64
	TransactionHash string
	Data            map[string]interface{}
}

// Close closes the Ethereum client connection
func (c *Client) Close() {
	c.ethClient.Close()
}
