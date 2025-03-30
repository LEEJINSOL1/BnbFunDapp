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

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setSigner(signer);
      setWalletAddress(address);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const addToken = (token) => {
    const newTokens = [...tokens, token];
    setTokens(newTokens);
    localStorage.setItem("tokens", JSON.stringify(newTokens)); // 로컬 스토리지 저장
    console.log("Added token:", token);
    console.log("Updated tokens:", newTokens);
  };

  useEffect(() => {
    const storedTokens = localStorage.getItem("tokens");
    if (storedTokens) {
      setTokens(JSON.parse(storedTokens)); // 초기 상태 복원
    }
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      provider.listAccounts().then((accounts) => {
        if (accounts.length > 0) connectWallet();
      });
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) connectWallet();
        else {
          setWalletAddress("");
          setSigner(null);
          setTokens(JSON.parse(localStorage.getItem("tokens") || "[]"));
        }
      });
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <header className="p-4 flex justify-between items-center border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold tracking-tight">BNB.Fun</h1>
          <nav>
            <button
              onClick={connectWallet}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-200 mr-2"
            >
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </nav>
        </header>
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
          <Route path="/presale/:tokenAddress" element={<PresalePage signer={signer} tokens={tokens} />} />
        </Routes>
        {console.log("Tokens passed to PresalePage:", tokens)}
        {isModalOpen && (
          <CreateTokenModal onClose={() => setIsModalOpen(false)} onCreate={addToken} signer={signer} />
        )}
        <footer className="p-4 text-center border-t border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400">© 2025 BNB.Fun. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;