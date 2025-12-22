# Redis Clone

A lightweight Redis-compatible server implementation written in TypeScript. This project implements core Redis functionality including string operations, list operations, streams, and transactions using the RESP (REdis Serialization Protocol).

## Features

### Data Structures
- **Strings**: Basic key-value storage with operations like SET, GET, INCR
- **Lists**: Ordered collections with push/pop operations from both ends
- **Streams**: Append-only log data structure for event streaming
- **Pub/Sub**: Message broadcasting system for publish/subscribe pattern

### Commands Implemented

#### Basic Commands
- `PING` - Test server connectivity
- `ECHO` - Echo back a message
- `TYPE` - Determine the type of a key

#### String Commands
- `SET key value [EX seconds] [PX milliseconds]` - Set a key-value pair with optional expiration
- `GET key` - Get value of a key
- `INCR key` - Increment the integer value of a key

#### List Commands
- `LPUSH key element [element ...]` - Prepend elements to a list
- `RPUSH key element [element ...]` - Append elements to a list
- `LPOP key` - Remove and return the first element
- `LRANGE key start stop` - Get a range of elements from a list
- `LLEN key` - Get the length of a list
- `BLPOP key [key ...] timeout` - Blocking left pop operation

#### Stream Commands
- `XADD key ID field value [field value ...]` - Append entry to a stream
- `XRANGE key start end [COUNT count]` - Query range of entries in a stream
- `XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] id [id ...]` - Read data from streams

#### Transaction Commands
- `MULTI` - Mark the start of a transaction block
- `EXEC` - Execute all commands in a transaction
- `DISCARD` - Discard all commands in a transaction
- `WATCH key [key ...]` - Watch keys for conditional transaction execution

#### Pub/Sub Commands
- `SUBSCRIBE channel [channel ...]` - Subscribe to one or more channels
- `UNSUBSCRIBE [channel [channel ...]]` - Unsubscribe from channels
- `PUBLISH channel message` - Publish a message to a channel

## Architecture

### Core Components

- **Protocol Layer** (`src/protocol/`)
  - RESP parser and encoder for Redis protocol compliance
  
- **Storage Layer** (`src/store/`)
  - In-memory data store with support for multiple data types
  - Client blocking management for blocking operations
  
- **Command Layer** (`src/commands/`)
  - Command registry and handler system
  - Modular command implementations organized by data type
  - Transaction management system

## Installation

```bash
npm install
```

## Quick Start

Build and run the server, then connect using redis-cli:

```bash
# Build the project
npm install
npm run build

# Start the server (listens on port 8001)
npm start

# In a new terminal, connect with redis-cli
redis-cli -p 8001
```

**Don't have redis-cli installed?** Use Docker:
```bash
docker run --rm -it --add-host=host.docker.internal:host-gateway redis:7 redis-cli -h host.docker.internal -p 8001
```

### Development Mode
Run the server with hot-reloading:
```bash
npm run dev
```

Example session:
```bash
127.0.0.1:8001> PING
PONG
127.0.0.1:8001> SET mykey "Hello"
OK
127.0.0.1:8001> GET mykey
"Hello"
127.0.0.1:8001> RPUSH mylist "item1" "item2"
(integer) 2
127.0.0.1:8001> LRANGE mylist 0 -1
1) "item1"
2) "item2"
```

## Project Structure

```
src/
├── commands/
│   ├── commandHandler.ts      # Main command dispatcher
│   ├── commandRegistry.ts     # Command registration
│   ├── ping.ts                # PING command
│   ├── lists/                 # List operations
│   ├── stream/                # Stream operations
│   ├── strings/               # String operations
│   └── transactions/          # Transaction support
├── protocol/
│   ├── encodeRESP.ts         # RESP encoder
│   └── parseRESP.ts          # RESP parser
├── store/
│   └── memoryStore.ts        # In-memory storage
└── utils/
    ├── isEqual.ts            # Utility functions
    └── types.ts              # Type definitions
```

## Development

### Type Checking
```bash
npm run type-check
```

### Build (Watch Mode)
```bash
npm run build:watch
```

## Technical Details

### RESP Protocol
The server implements the Redis Serialization Protocol (RESP), supporting:
- Simple Strings
- Errors
- Integers
- Bulk Strings
- Arrays
- Null values

### Transaction Support
Implements optimistic locking with WATCH/MULTI/EXEC:
- Commands are queued during MULTI
- WATCH monitors keys for changes
- EXEC atomically executes queued commands if watched keys haven't changed
- DISCARD cancels the transaction

### Blocking Operations
The server supports blocking operations like `BLPOP`:
- Clients are blocked until data is available or timeout occurs
- Automatic cleanup on client disconnect
- Notification system for waking blocked clients

## Requirements

- Node.js (v18 or higher recommended)
- TypeScript 5.9+
