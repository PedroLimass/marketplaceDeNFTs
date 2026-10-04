import type { WalletType } from './schemas/wallet.schemas'

export const walletTypeLabels: Record<WalletType, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}
