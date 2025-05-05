import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import TokenList from "./components/TokenList";
import FundingChart from "./components/FundingChart";
import TransactionList from "./components/TransactionList";
import TradePanel from "./components/TradePanel";
import "./index.css";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [selectedToken, setSelectedToken] = useState(null);
    const [tokens, setTokens] = useState(() => {
        const savedTokens = localStorage.getItem("tokens");
        return savedTokens ? JSON.parse(savedTokens) : [];
    });
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                label: "프리세일 모금액 (BNB)",
                data: [],
                borderColor: "rgb(75, 192, 192)",
                tension: 0.1,
            },
            {
                label: "거래대금 (BNB)",
                data: [],
                borderColor: "rgb(255, 99, 132)",
                tension: 0.1,
            },
        ],
    });

    useEffect(() => {
        localStorage.setItem("tokens", JSON.stringify(tokens));
    }, [tokens]);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/tokens");
                const tokenList = response.data.map(token => ({
                    address: token.token_address,
                    name: token.name,
                    symbol: token.symbol,
                    createdAt: new Date(token.created_at).toLocaleString(),
                    raisedFunds: token.raised_funds,
                    volume: token.volume,
                }));
                setTokens(tokenList);
            } catch (err) {
                console.error("토큰 목록 가져오기 실패:", err);
            }
        };
        fetchTokens();

        socket.on("newToken", (newToken) => {
            setTokens(prev => [
                {
                    address: newToken.token_address,
                    name: newToken.name,
                    symbol: newToken.symbol,
                    createdAt: new Date(newToken.created_at).toLocaleString(),
                    raisedFunds: newToken.raised_funds,
                    volume: newToken.volume,
                },
                ...prev,
            ]);
        });

        socket.on("updateToken", (updatedToken) => {
            setTokens(prev =>
                prev.map(token =>
                    token.address === updatedToken.token_address
                        ? { ...token, raisedFunds: updatedToken.raised_funds, volume: updatedToken.volume }
                        : token
                )
            );
        });

        return () => {
            socket.off("newToken");
            socket.off("updateToken");
        };
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!selectedToken) {
                setTransactions([]);
                return;
            }
            try {
                setLoadingTransactions(true);
                const response = await axios.get(`http://localhost:5000/api/transactions/${selectedToken.address}`);
                setTransactions(
                    response.data.map(tx => ({
                        tokenAddress: tx.token_address,
                        type: tx.type === "buy" ? "매수" : "매도",
                        amount: tx.token_amount,
                        bnbValue: tx.bnb_value,
                        timestamp: new Date(tx.timestamp).getTime(),
                    }))
                );
            } catch (err) {
                console.error("트랜잭션 조회 실패:", err);
                setTransactions([]);
            } finally {
                setLoadingTransactions(false);
            }
        };

        const fetchChartData = async () => {
            if (!selectedToken) {
                setChartData({
                    labels: [],
                    datasets: [
                        { label: "프리세일 모금액 (BNB)", data: [], borderColor: "rgb(75, 192, 192)", tension: 0.1 },
                        { label: "거래대금 (BNB)", data: [], borderColor: "rgb(255, 99, 132)", tension: 0.1 },
                    ],
                });
                return;
            }
            try {
                const response = await axios.get(`http://localhost:5000/api/transactions/${selectedToken.address}`);
                const transactions = response.data;

                const now = new Date();
                const labels = [];
                const raisedFunds = [];
                const volumes = [];
                for (let i = 5; i >= 0; i--) {
                    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
                    labels.push(time.toISOString());
                    const recentTxs = transactions.filter(tx => {
                        const txTime = new Date(tx.timestamp);
                        return txTime >= new Date(time.getTime() - 5 * 60 * 1000) && txTime <= time;
                    });
                    const raised = recentTxs
                        .filter(tx => tx.type === "buy")
                        .reduce((sum, tx) => sum + parseFloat(tx.bnb_value || 0), 0);
                    const volume = recentTxs
                        .filter(tx => tx.type === "sell")
                        .reduce((sum, tx) => sum + parseFloat(tx.bnb_value || 0), 0);
                    raisedFunds.push(raised.toFixed(8));
                    volumes.push(volume.toFixed(8));
                }

                setChartData({
                    labels,
                    datasets: [
                        { label: "프리세일 모금액 (BNB)", data: raisedFunds, borderColor: "rgb(75, 192, 192)", tension: 0.1 },
                        { label: "거래대금 (BNB)", data: volumes, borderColor: "rgb(255, 99, 132)", tension: 0.1 },
                    ],
                });
            } catch (err) {
                console.error("차트 데이터 가져오기 실패:", err);
                setChartData({
                    labels: [],
                    datasets: [
                        { label: "프리세일 모금액 (BNB)", data: [], borderColor: "rgb(75, 192, 192)", tension: 0.1 },
                        { label: "거래대금 (BNB)", data: [], borderColor: "rgb(255, 99, 132)", tension: 0.1 },
                    ],
                });
            }
        };

        fetchTransactions();
        fetchChartData();

        if (selectedToken) {
            socket.emit("joinTokenRoom", selectedToken.address);
            socket.on("newTransaction", (tx) => {
                const formatted = {
                    tokenAddress: selectedToken.address,
                    type: tx.type === "buy" ? "매수" : "매도",
                    amount: tx.amount,
                    bnbValue: tx.bnbValue,
                    timestamp: new Date(tx.timestamp).getTime(),
                };
                setTransactions(prev => [formatted, ...prev]);

                setChartData(prev => {
                    const now = new Date();
                    const labels = [...prev.labels];
                    const raisedFunds = [...prev.datasets[0].data];
                    const volumes = [...prev.datasets[1].data];

                    if (labels.length > 0) {
                        const lastIndex = labels.length - 1;
                        if (tx.type === "buy") {
                            raisedFunds[lastIndex] = (parseFloat(raisedFunds[lastIndex]) + parseFloat(tx.bnbValue)).toFixed(8);
                        } else if (tx.type === "sell") {
                            volumes[lastIndex] = (parseFloat(volumes[lastIndex]) + parseFloat(tx.bnbValue)).toFixed(8);
                        }
                    } else {
                        labels.push(now.toISOString());
                        raisedFunds.push(tx.type === "buy" ? parseFloat(tx.bnbValue).toFixed(8) : "0");
                        volumes.push(tx.type === "sell" ? parseFloat(tx.bnbValue).toFixed(8) : "0");
                    }

                    return {
                        labels,
                        datasets: [
                            { label: "프리세일 모금액 (BNB)", data: raisedFunds, borderColor: "rgb(75, 192, 192)", tension: 0.1 },
                            { label: "거래대금 (BNB)", data: volumes, borderColor: "rgb(255, 99, 132)", tension: 0.1 },
                        ],
                    };
                });
            });
        }

        return () => {
            socket.off("newTransaction");
        };
    }, [selectedToken]);

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
                        <FundingChart chartData={chartData} />
                    ) : (
                        <p className="text-gray-400">토큰을 선택하세요.</p>
                    )}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-4">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">프리세일 트랜잭션</h2>
                    {selectedToken ? (
                        loadingTransactions ? (
                            <p className="text-gray-400">트랜잭션 로딩 중...</p>
                        ) : (
                            <TransactionList
                                tokenAddress={selectedToken.address}
                                transactions={transactions}
                            />
                        )
                    ) : (
                        <p className="text-gray-400">토큰을 선택하세요.</p>
                    )}
                </div>
            </div>
            <div className="w-1/4 flex flex-col">
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg m-4 flex-grow">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">생성된 토큰</h2>
                    <TokenList
                        tokens={tokens}
                        setTokens={setTokens}
                        onSelect={setSelectedToken}
                        provider={provider}
                    />
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