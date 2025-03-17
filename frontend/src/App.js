import React, { useState } from 'react';
import Web3 from 'web3';
import MetaMaskOnboarding from '@metamask/onboarding';
import TokenModal from './TokenModal';

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onboarding = new MetaMaskOnboarding();

  // MetaMask 연결 함수
  const connectMetaMask = async () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // BNB 테스트넷으로 네트워크 전환 (chainId: 97)
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x61' }],
        });
        alert('MetaMask가 BNB 테스트넷에 연결되었습니다!');
      } catch (error) {
        console.error(error);
        alert('MetaMask 연결 실패: ' + error.message);
      }
    } else {
      onboarding.startOnboarding(); // MetaMask 설치 유도
    }
  };

  const openModal = () => {
    if (!web3) {
      alert('먼저 MetaMask를 연결해주세요.');
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>토큰 생성기</h1>
      <button onClick={connectMetaMask}>MetaMask 연결</button>
      <button onClick={openModal}>토큰 생성 창 열기</button>
      {isModalOpen && <TokenModal web3={web3} account={account} closeModal={closeModal} />}
    </div>
  );
}

export default App;