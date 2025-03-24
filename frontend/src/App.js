import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { ethers } from "ethers";
import TokenList from "./components/TokenList";
import CreateTokenModal from "./components/CreateTokenModal";
import PresalePage from "./components/PresalePage";
import "./App.css";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [signer, setSigner] = useState(null);

  // 지갑 연결 함수
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // 메타마스크 연결 요청
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setSigner(signer);
        setWalletAddress(address);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 페이지 로드 시 지갑 연결 상태 확인
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      provider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      });

      // 계정 변경 감지
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setWalletAddress("");
          setSigner(null);
        }
      });
    }
  }, []);

  const addToken = (token) => {
    setTokens([...tokens, token]);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        {/* 헤더 */}
        <header className="p-4 flex justify-between items-center border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold tracking-tight">BNB.Fun</h1>
          <nav>
            <button
              onClick={connectWallet}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-200"
            >
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </nav>
        </header>

        {/* 메인 콘텐츠 */}
        <Routes>
          <Route
            path="/"
            element={
              <main className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-center mb-8">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 px-6 py-3 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors duration-200 shadow-md"
                    disabled={!walletAddress}
                  >
                    Create Token
                  </button>
                </div>
                <TokenList tokens={tokens} />
              </main>
            }
          />
          <Route
            path="/presale/:tokenId"
            element={<PresalePage tokens={tokens} />}
          />
        </Routes>

        {/* 모달 */}
        {isModalOpen && (
          <CreateTokenModal
            onClose={() => setIsModalOpen(false)}
            onCreate={addToken}
            signer={signer}
          />
        )}

        {/* 푸터 */}
        <footer className="p-4 text-center border-t border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">© 2025 BNB.Fun. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 