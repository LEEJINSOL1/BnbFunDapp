import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import TokenList from "./components/TokenList";
import FundingChart from "./components/FundingChart";
import TransactionList from "./components/TransactionList";
import TradePanel from "./components/TradePanel";
import "./index.css";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

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
    const [chartData, setChartData] = useState([]);
    const [interval, setChartInterval] = useState("1m");    const socketInitialized = useRef(false);
    const lastTokenAddress = useRef(null);

    useEffect(() => {
        localStorage.setItem("tokens", JSON.stringify(tokens));
    }, [tokens]);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/tokens");
                const tokenList = response.data.map((token) => ({
                    address: token.token_address,
                    name: token.name,
                    symbol: token.symbol,
                    createdAt: new Date(token.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
                    raisedFunds: token.raised_funds,
                    volume: token.volume,
                }));
                setTokens(tokenList);

                if (tokenList.length > 0 && !selectedToken) {
                    const highestFundedToken = tokenList.reduce((max, token) => {
                        const maxValue = parseFloat(max.raisedFunds.replace(" BNB", ""));
                        const tokenValue = parseFloat(token.raisedFunds.replace(" BNB", ""));
                        return tokenValue > maxValue ? token : max;
                    }, tokenList[0]);
                    setSelectedToken(highestFundedToken);
                }
            } catch (err) {
                console.error("토큰 목록 가져오기 실패:", err);
            }
        };
        fetchTokens();
    }, []);

    const fetchChartData = async () => {
        if (!selectedToken) {
            setChartData([]);
            return;
        }
        try {
            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
            const response = await axios.get(
                `http://localhost:5000/api/candlestick/${selectedToken.address}?since=${since}&interval=${interval}`
            );
            console.log("Fetched chartData:", response.data);
            setChartData(response.data);
        } catch (err) {
            console.error("차트 데이터 가져오기 실패:", err);
            setChartData([]);
        }
    };

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!selectedToken) {
                setTransactions([]);
                return;
            }
            try {
                setLoadingTransactions(true);
                const response = await axios.get(`http://localhost:5000/api/transactions/${selectedToken.address}`);
                const mappedTransactions = response.data.map((tx) => ({
                    id: `${tx.timestamp}-${tx.token_address}-${tx.type}`,
                    tokenAddress: tx.token_address,
                    type: tx.type === "buy" ? "매수" : "매도",
                    amount: tx.token_amount,
                    bnbValue: tx.bnb_value,
                    timestamp: new Date(tx.timestamp).getTime(),
                }));
                setTransactions(mappedTransactions);
            } catch (err) {
                console.error("트랜잭션 조회 실패:", err);
                setTransactions([]);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchTransactions();
        fetchChartData();

        if (selectedToken) {
            // 이전 방 나가기
            if (lastTokenAddress.current && lastTokenAddress.current !== selectedToken.address) {
                socket.emit("leaveTokenRoom", lastTokenAddress.current);
                console.log(`Left room: ${lastTokenAddress.current}`);
            }
            // 새 방 참여
            socket.emit("joinTokenRoom", selectedToken.address);
            console.log(`Joined room: ${selectedToken.address}`);
            lastTokenAddress.current = selectedToken.address;

            if (!socketInitialized.current) {
                socketInitialized.current = true;

                socket.on("connect", () => {
                    console.log("Socket connected:", socket.id);
                    if (selectedToken) {
                        socket.emit("joinTokenRoom", selectedToken.address);
                        console.log(`Rejoined room on reconnect: ${selectedToken.address}`);
                    }
                });

                socket.on("disconnect", () => {
                    console.warn("Socket disconnected");
                });

                socket.on("newToken", (newToken) => {
                    setTokens((prev) => [
                        {
                            address: newToken.token_address,
                            name: newToken.name,
                            symbol: newToken.symbol,
                            createdAt: new Date(newToken.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
                            raisedFunds: newToken.raised_funds,
                            volume: newToken.volume,
                        },
                        ...prev,
                    ]);
                });

                socket.on("updateToken", (updatedToken) => {
                    setTokens((prev) =>
                        prev.map((token) =>
                            token.address === updatedToken.token_address
                                ? { ...token, raisedFunds: updatedToken.raised_funds, volume: updatedToken.volume }
                                : token
                        )
                    );
                });

                const handleLatestCandle = (candle) => {
                    console.log("Received latestCandle:", candle);
                    setChartData((prev) => {
                        const newChartData = [...prev];
                        const lastCandleIndex = newChartData.findIndex(c => c.time === candle.time);
                        if (lastCandleIndex >= 0) {
                            newChartData[lastCandleIndex] = candle;
                        } else {
                            newChartData.push(candle);
                        }
                        console.log("Updated chartData with latestCandle:", newChartData);
                        return newChartData;
                    });
                };

                const handleNewTransaction = (tx) => {
                    console.log("Received newTransaction:", tx);

                    if (tx.token_address !== selectedToken.address) {
                        console.log(`Ignoring transaction for non-selected token: ${tx.token_address}`);
                        return;
                    }

                    const txTime = new Date(tx.timestamp);
                    if (isNaN(txTime.getTime())) {
                        console.error("유효하지 않은 tx.timestamp:", tx.timestamp);
                        return;
                    }

                    const txId = `${tx.timestamp}-${tx.token_address}-${tx.type}`;
                    setTransactions((prev) => {
                        if (prev.some(t => t.id === txId)) return prev;
                        const formatted = {
                            id: txId,
                            tokenAddress: selectedToken.address,
                            type: tx.type === "buy" ? "매수" : "매도",
                            amount: tx.token_amount,
                            bnbValue: tx.bnb_value,
                            timestamp: txTime.getTime(),
                        };
                        return [formatted, ...prev.slice(0, 99)];
                    });

                    setChartData((prev) => {
                        if (!tx.updatedCandle) {
                            console.warn("updatedCandle 데이터 누락:", tx);
                            return prev;
                        }

                        const { time, open, high, low, close, raised_funds, volume } = tx.updatedCandle;
                        if (isNaN(close) || isNaN(raised_funds)) {
                            console.error("유효하지 않은 updatedCandle 데이터:", tx.updatedCandle);
                            return prev;
                        }

                        const candleTime = new Date(time * 1000);
                        console.log(`Updating chartData: time=${time}, date=${candleTime.toISOString()}, open=${open}, close=${close}, raised_funds=${raised_funds}, bnb_value=${tx.bnb_value}`);

                        const newChartData = [...prev];
                        const lastCandleIndex = newChartData.findIndex(c => c.time === time);

                        if (lastCandleIndex >= 0) {
                            newChartData[lastCandleIndex] = {
                                time,
                                open,
                                high,
                                low,
                                close,
                                raised_funds,
                                volume
                            };
                        } else {
                            newChartData.push({
                                time,
                                open,
                                high,
                                low,
                                close,
                                raised_funds,
                                volume
                            });
                        }

                        console.log("Updated chartData:", newChartData);
                        return newChartData;
                    });
                };

                socket.on("latestCandle", handleLatestCandle);
                socket.on("newTransaction", handleNewTransaction);

                // 주기적 데이터 검증 (10초마다)
                const pollingInterval = setInterval(() => {
                    fetchChartData();
                }, 10000);

                return () => {
                    socket.off("connect");
                    socket.off("disconnect");
                    socket.off("newToken");
                    socket.off("updateToken");
                    socket.off("latestCandle", handleLatestCandle);
                    socket.off("newTransaction", handleNewTransaction);
                    clearInterval(pollingInterval);
                    socketInitialized.current = false;
                };
            }
        }
    }, [selectedToken, interval]);

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
                    <h2 className="text-xl font-bold text-blue-400 mb-2">프리세일 총 모금액 차트</h2>
                    {selectedToken ? (
                        <FundingChart
                            chartData={chartData}
                            interval={interval}
                            setInterval={setChartInterval}
                            selectedToken={selectedToken}    // ← 반드시 전달
                        />
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
                            <TransactionList tokenAddress={selectedToken.address} transactions={transactions} />
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
                        selectedToken={selectedToken}
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
