import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import MetaMaskOnboarding from '@metamask/onboarding';
import TokenModal from './TokenModal';
import './App.css';

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const onboarding = new MetaMaskOnboarding();

  useEffect(() => {
    // 토큰 리스트 가져오기
    fetch('http://localhost:5000/tokens')
      .then(res => res.json())
      .then(data => setTokens(data))
      .catch(err => console.error(err));
  }, []);

  const connectMetaMask = async () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x61' }], // BNB 테스트넷
        });
        alert('MetaMask가 BNB 테스트넷에 연결되었습니다!');
      } catch (error) {
        console.error(error);
        alert('MetaMask 연결 실패: ' + error.message);
      }
    } else {
      onboarding.startOnboarding();
    }
  };

  const openModal = () => {
    if (!web3) {
      alert('먼저 MetaMask를 연결해주세요.');
      return;
    }
    setIsModalOpen(true);
  };

  const selectToken = (token) => {
    setSelectedToken(token);
    // 트랜잭션 내역 가져오기
    fetch(`http://localhost:5000/tokens/transactions/${token.address}`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error(err));
  };

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.png" alt="Logo" className="logo" />
        <select className="network-select">
          <option value="0x61">BNB Testnet</option>
        </select>
        <button onClick={connectMetaMask} className="connect-button">
          {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>
      <div className="main-content">
        <div className="chart-section">
          <h2>{selectedToken ? `${selectedToken.name} Chart` : 'Select a Token'}</h2>
          <div className="chart-placeholder">
            {selectedToken ? (
              <div>차트 데이터 (예: TradingView 임베드 또는 더미)</div>
            ) : (
              <p>토큰을 선택해 주세요.</p>
            )}
          </div>
        </div>
        <div className="trade-section">
          <h2>Trade</h2>
          <div className="trade-ui">
            <input type="number" placeholder="Amount" />
            <button onClick={() => alert('Buy implemented')}>Buy</button>
            <button onClick={() => alert('Sell implemented')}>Sell</button>
          </div>
        </div>
        <div className="transaction-section">
          <h2>Transactions</h2>
          <ul className="transaction-list">
            {transactions.length > 0 ? (
              transactions.map(tx => (
                <li key={tx.txHash}>{`${tx.type}: ${tx.amount} from ${tx.from} to ${tx.to}`}</li>
              ))
            ) : (
              <li>No transactions</li>
            )}
          </ul>
        </div>
        <div className="token-list">
          <h2>Token List</h2>
          <ul>
            {tokens.map((token) => (
              <li key={token.address} onClick={() => selectToken(token)}>
                {token.name} ({token.ticker})
              </li>
            ))}
          </ul>
          {account ? (
            <button onClick={openModal}>Create New Token</button>
          ) : (
            <button onClick={connectMetaMask}>Connect Wallet</button>
          )}
        </div>
      </div>
      <footer className="footer">
        <p>© 2025 BnbFun Project</p>
      </footer>
      {isModalOpen && <TokenModal web3={web3} account={account} closeModal={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default App;