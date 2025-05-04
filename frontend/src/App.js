import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import TokenList from "./components/TokenList";
import FundingChart from "./components/FundingChart";
import TransactionList from "./components/TransactionList";
import TradePanel from "./components/TradePanel";
import "./index.css";

function App() {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [selectedToken, setSelectedToken] = useState(null);
    const [tokens, setTokens] = useState(() => {
        // 새로고침 시 localStorage에서 데이터 가져오기
        const savedTokens = localStorage.getItem("tokens");
        return savedTokens ? JSON.parse(savedTokens) : [];
    });

    // tokens 상태 변경 시 localStorage에 저장
    useEffect(() => {
        localStorage.setItem("tokens", JSON.stringify(tokens));
    }, [tokens]);

    useEffect(() => {
        const connectWallet = async () => {
            try {
                if (window.ethereum) {
                    const newProvider = new ethers.providers.Web3Provider(window.ethereum);
                    setProvider(newProvider);

                    const accounts = await newProvider.send("eth_requestAccounts", []);
                    setAccount(accounts[0]);
                    setSigner(newProvider.getSigner());

                    window.ethereum.on("accountsChanged", (newAccounts) => {
                        setAccount(newAccounts[0] || null);
                        setSigner(newProvider.getSigner());
                    });

                    window.ethereum.on("chainChanged", () => {
                        window.location.reload();
                    });

                    window.ethereum.on("disconnect", () => {
                        setAccount(null);
                        setSigner(null);
                        setProvider(null);
                    });
                } else {
                    console.error("MetaMask가 설치되지 않았습니다.");
                }
            } catch (err) {
                console.error("지갑 연결 실패:", err);
            }
        };

        connectWallet();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            <div className="w-3/4 p-4">
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">프리세일 모금액 차트</h2>
                    {selectedToken ? (
                        <FundingChart tokenAddress={selectedToken.address} />
                    ) : (
                        <p className="text-gray-400">토큰을 선택하세요.</p>
                    )}
                </div>
            </div>
            <div className="w-1/4 flex flex-col">
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg m-4 flex-grow">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">생성된 토큰</h2>
                    <TokenList tokens={tokens} setTokens={setTokens} onSelect={setSelectedToken} provider={provider} />
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg m-4">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">프리세일 트랜잭션</h2>
                    {selectedToken ? (
                        <TransactionList tokenAddress={selectedToken.address} />
                    ) : (
                        <p className="text-gray-400">토큰을 선택하세요.</p>
                    )}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg m-4">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">프리세일 거래</h2>
                    {account ? (
                        <TradePanel
                            account={account}
                            signer={signer}
                            selectedToken={selectedToken}
                            setTokens={setTokens}
                        />
                    ) : (
                        <button
                            onClick={async () => {
                                const newProvider = new ethers.providers.Web3Provider(window.ethereum);
                                await newProvider.send("eth_requestAccounts", []);
                                setAccount((await newProvider.listAccounts())[0]);
                                setProvider(newProvider);
                                setSigner(newProvider.getSigner());
                            }}
                            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            지갑 연결
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;