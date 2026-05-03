# NexaPay Wallet

A secure and modern Stellar-based crypto wallet built with React and Vite.

## Features

- **Create and Import Wallets** - Easily create new wallets or import existing ones
- **Secure PIN-Based Unlock** - PIN-protected wallet access with encrypted local storage
- **Send and Receive XLM** - Transfer Stellar Lumens (XLM) with ease
- **Real-Time Balance Tracking** - Monitor your wallet balance in real-time
- **Transaction History** - Complete record of all your transactions
- **Multi-Wallet Support** - Manage multiple wallets from a single application
- **2FA Support** - Two-factor authentication for enhanced security
- **Market Insights** - Real-time XLM price tracking and market data

## Tech Stack

- **Frontend Framework** - React 18
- **State Management** - Redux Toolkit
- **Build Tool** - Vite
- **Blockchain SDK** - Stellar SDK
- **Styling** - Tailwind CSS
- **Encryption** - CryptoJS

## Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ChaceEthan/nexapay-fronten.git
cd nexapay-fronten

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Security

- **Encrypted Storage** - Private keys are encrypted using PBKDF2 with salt
- **In-Memory Keys** - Decrypted keys are stored only in memory (Redux state)
- **Wallet Lock** - Automatic locking after 5 minutes of inactivity
- **PIN Protection** - All wallet operations require PIN verification
- **No Seed Phrase Storage** - Backup phrases are optional for recovery

## Network

- **Blockchain** - Stellar Public Network (Testnet for development)
- **Testnet XLM** - Available via Stellar testnet faucet

## Project Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Page components for routing
├── services/       # API and Stellar blockchain services
├── utils/          # Utility functions and helpers
├── hooks/          # Custom React hooks
├── routes/         # Route configuration
├── authSlice.js    # Redux authentication state
├── walletSlice.js  # Redux wallet state
├── store.js        # Redux store configuration
└── App.jsx         # Main app component
```

## Development

```bash
# Run development server with hot-reload
npm run dev

# Linting and validation
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License - See LICENSE file for details

## Author

**ChaceEthan**

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/ChaceEthan/nexapay-fronten).

---

**Security Note**: NexaPay is designed for learning and testing purposes on Stellar's testnet. For production use with real funds, conduct a thorough security audit.
