import { useContext } from 'react';
import { WalletContext, WalletContextType } from '../contexts/WalletContext';

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
