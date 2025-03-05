# Mina zkApp: Mina Mastermind

![alt text](./images/mastermind-board.png)

# Table of Contents

## Mastermind Game Documentation

- [Understanding the Mastermind Game](#understanding-the-mastermind-game)

  - [Overview](#overview)
  - [Game Rules](#game-rules)

- [Introduction](#introduction)
- [Motivation](#motivation)

- [Mastermind zkApp Structure](#mastermind-zkapp-structure)

- [How to Build & Test](#how-to-build--test)
  - [How to build](#how-to-build)
  - [How to run tests](#how-to-run-tests)
  - [How to run coverage](#how-to-run-coverage)
- [Running with Lightnet](#running-with-lightnet)
  - [Prerequisites](#1-prerequisites)
    - [Install Docker](#install-docker)
  - [Running Lightnet](#2-running-lightnet)
  - [Setting Up the Contract](#3-setting-up-the-contract)
  - [Linking the Contract in the UI](#4-linking-the-contract-in-the-ui)
  - [Running the UI](#5-running-the-ui)
  - [Working with Lightnet Test Accounts](#working-with-lightnet-test-accounts)
    - [HTTP GET](#http-get)
    - [Supported Query Parameters](#supported-query-parameters)
    - [Example Request](#example-request)
    - [Example Response](#example-response)
  - [Adding the Lightnet Network to Auro Wallet](#adding-the-lightnet-network-to-auro-wallet)
  - [Adding the Test Account to Auro Wallet](#adding-the-test-account-to-auro-wallet)
  - [Tutorial](#tutorial)
- [License](#license)

# Understanding the Mastermind Game

## Overview

- The game involves two players: a `Code Master` and a `Code Breaker`.
- Inspired by [mastermind-noir](https://github.com/vezenovm/mastermind-noir), this version replaces colored pegs with a combination of 4 unique, non-zero digits.

## Game Rules

- The Code Master hosts a game and sets a secret combination for the Code Breaker to guess.

- The Code Breaker makes a guess and waits for the Code Master to provide a clue.

- The clue indicates the following:

  - **Hits**: Digits that are correctly guessed and in the correct position.
  - **Blows**: Digits that are correct but in the wrong position.

  Example:

  |        | P1  | P2  | P3  | P4  |
  | ------ | --- | --- | --- | --- |
  | Secret | 5   | 9   | 3   | 4   |
  | Guess  | 5   | 7   | 8   | 9   |
  | Clue   | 2   | 0   | 0   | 1   |

  - Code Master's secret combination: **5 9 3 4**
  - Code Breaker's guess: **5 7 8 9**
  - Clue: **2 0 0 1**
    - Result: `1` hit and `1` blow.
      - The hit is `5` in the first position.
      - The blow is `9` in the fourth position.
      -

- The game continues with alternating guesses and clues until the Code Breaker achieves 4 hits and uncovers the secret combination or fails to do so within the **maximum allowed attempts**.

# Introduction

This implementation is part of a multi-level series of the Mastermind zkApp game. It represents Level 2, which introduces packing techniques to efficiently store the history of actions for both the Code Master and the Code Breaker. Additionally, it incorporates dynamic array indexing and updates to retrieve and modify elements (fields) within lists, specifically in the context of zero-knowledge proof (ZKP) circuits.

- For a foundational understanding of the game, as well as insights into the enhancements introduced in Level 2, please refer to the [Mastermind Level 1](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level1?tab=readme-ov-file) code and documentation.

- **Note**: Level 1 also includes a [General zkApp Documentation](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level1?tab=readme-ov-file#general-zkapp-documentation), which covers key concepts related to zkApp development, along with details and APIs that are beyond the scope of this documentation.

# Motivation

- In the Level 1 implementation, both the [`unseparatedGuess` and `serializedClue` states](https://github.com/o1-labs-XT/mastermind-zkApp/blob/level1/src/Mastermind.ts#L27-L28) represent only a single guess and clue at a time.

  - While functional, this approach introduces the potential for errors, as it requires both players to manually track the history of the game.

  - Any mistake or oversight, particularly by the Code Breaker, could compromise their strategy, as the player must consider all prior clues to make informed guesses in subsequent turns.

  - Typically, the application frontend would display the game's history and progress to both players. However, since no live record is stored on-chain, this setup relies on trust that the frontend will accurately represent the game state without tampering.

  - Although a player may recognize inconsistencies based on their memory of previous moves, relying on trust in frontend code (instead of an on-chain record) undermines the trustless nature of the game.

  - The goal of the Level 2 implementation is to overcome the zkApp’s 8-state storage limit by storing the history of guesses and clues directly on-chain. This eliminates the need for trust in off-chain tracking and reduces the risk of player errors, ensuring a more reliable and trustless gameplay experience.

- Since the size of individual states (guesses and clues) is small, a practical solution is to pack multiple small states into a single storage state. This is feasible, as each storage state in zkApps is 255 bits.

- The [packing techniques](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level2?tab=readme-ov-file#packing-small-fields) introduced in this implementation can be applied beyond the game, serving as an efficient method to pack any list of small field elements into a single state, optimizing storage or for **encoding purposes**.

- Additionally, following the logic of the [giveClue method](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level2?tab=readme-ov-file#giveclue), which relies on the most recent guess stored on-chain, this implementation demonstrates [dynamic indexing](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level2?tab=readme-ov-file#dynamic-indexing) and [updating](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level2?tab=readme-ov-file#dynamic-updating) of field arrays to retrieve the latest guess based on the [turnCount state](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level2?tab=readme-ov-file#turncount).

  - These techniques are not limited to this game and can be applied in other contexts when the index is a provable type, such as a `Field`.

---

- Dive deeper to explore the innovative [techniques](https://github.com/o1-labs-XT/mastermind-zkApp/tree/level2?tab=readme-ov-file#techniques) and architectural choices that showcase this level advancement in the game’s design.

# Mastermind zkApp Structure

Following the game rules, the [MastermindZkApp](https://github.com/navigators-exploration-team/mina-mastermind-ui/blob/level2-ui/contracts/src/Mastermind.ts) should be deployed:

- The zkApp is initialized by calling the `initGame` method, with `maxAttempts` as the method parameter to set an upper limit.

- After initialization, the Code Master calls the `createGame` method to start the game and set a secret combination for the Code Breaker to solve.

- The Code Breaker then makes a guess by calling the `makeGuess` method with a valid combination as an argument.

- The Code Master submits the solution again to be checked against the previous guess and provides a clue.

- The Code Breaker should analyze the given clue and make another meaningful guess.

- The game continues by alternating between `makeGuess` and `giveClue` methods until the Code Breaker either uncovers the secret combination or fails by exceeding the allowed `maxAttempts`, concluding the game.

For more details on the game states, methods and techniques used, refer to [this repo](https://github.com/Shigoto-dev19/mina-mastermind/tree/level2) for more details!

# How to Build & Test

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```


# Running with Lightnet

This guide provides step-by-step instructions to set up and run the zkApp, including the UI and the Lightnet blockchain network.

## 1. Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 
- **Yarn**
- **Docker** 

### Install Docker

If you **don't have Docker installed**, you can download and install it using the links below:

- **Windows:** [Install Docker for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)  
- **Mac:** [Install Docker for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)  
- **Linux:** [Install Docker for Linux](https://docs.docker.com/desktop/setup/install/linux/ubuntu/)  

## 2. Running Lightnet

Once Docker is installed and running, start the Lightnet blockchain network using the following command:

```sh
zk lightnet start --no-archive
```

### Note:
By default, starting the Lightnet blockchain network also launches archive data tools such as:
- The Mina archive process
- PostgreSQL RDBMS
- Archive-Node-API application

If your testing does **not** require archive data tools and you want to use fewer system resources, you can disable them using the `--no-archive` option, as shown above.

## 3. Setting Up the Contract

Navigate to the contracts directory and link the package:

```sh
cd contracts
npm run build
yarn link
```

## 4. Linking the Contract in the UI

Go to the `ui` directory and link the contract package:


```sh
cd ../ui
yarn link mina-mastermind
```

## 5. Running the UI

To start the frontend, run the following commands inside the `ui` directory:

```sh
yarn install
yarn dev
```

This will launch the UI, allowing you to interact with the zkApp.

## Working with Lightnet Test Accounts

To get a set of testing accounts for Lightnet, you can use the following API:

### HTTP GET:
```
http://localhost:8181/acquire-account
```

### Supported Query Parameters:
- **isRegularAccount**=`<boolean>` (default: `true`)
  - Useful if you need to get a non-zkApp account.
- **unlockAccount**=`<boolean>` (default: `false`)
  - Useful if you need to get an unlocked account.

### Example Request:
```
http://localhost:8181/acquire-account?isRegularAccount=true&unlockAccount=true
```

### Example Response:
```json
{
  "used": true,
  "pk": "B62qkAenR6pceWB8TGTZ5XxLMa1DTmnndwyxnhxPr4Y5dT4ZtRPLmqA",
  "sk": "EKEoXY2iT3GFwnzJQW3HHCCA9gBZSpq3GPomxW4m6SP5H6aFJsWJ"
}
```

By doing this, you will get an account that contains **1550 tMINA** on the Lightnet network.


## Adding the Lightnet Network to Auro Wallet

To integrate the Lightnet network into the Auro Wallet, follow these steps:

1. Open **Settings** in the Auro Wallet.
2. Click **Network**.
3. Click **Add Network**.
4. Set the **Node Name** to `lightnet`.
5. Set the **Node URL** to:
   ```
   http://localhost:8080/graphql
   ```
6. Click **Confirm**.

![Adding the Lightnet Network to Auro Wallet](./images/add-network.gif)

## Adding the Test Account to Auro Wallet

1. Ensure that you are in the **Account Management Menu**.
2. Click **Add Account**.
3. Choose **Private Key**.
4. Enter the **Account Name** and click **Next**.
5. Enter the **previously extracted private key**.
6. Click **Confirm** to complete the process.

![Adding the Test Account to Auro Wallet](./images/add-account.gif)

# Tutorial
![Tutorial](./images/rules.gif)


# License

[Apache-2.0](contracts/LICENSE)
