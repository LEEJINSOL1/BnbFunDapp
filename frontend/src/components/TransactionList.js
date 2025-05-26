import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const TransactionList = ({ tokenAddress }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!tokenAddress) {
            setTransactions([]);
            return;
        }

        const fetchTransactions = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await axios.get(`http://localhost:5000/api/transactions/${tokenAddress}`);
                const txs = response.data.map(tx => {
                    const date = new Date(tx.timestamp);
                    const formattedDate = date.toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    //console.log("TransactionList - Transaction timestamp (KST):", formattedDate, "Raw timestamp:", tx.timestamp);
                    return {
                        time: formattedDate,
                        type: tx.type === "buy" ? "매수" : "매도",
                        amount: tx.token_amount,
                        bnbValue: tx.bnb_value,
                    };
                });
                setTransactions(txs);
            } catch (err) {
                console.error("트랜잭션 불러오기 실패:", err);
                setError("트랜잭션 데이터를 불러오지 못했습니다.");
            }
            setLoading(false);
        };

        fetchTransactions();
        socket.emit("joinTokenRoom", tokenAddress);
        console.log(`joinTokenRoom emitted for tokenAddress: ${tokenAddress}`);

        socket.on("newTransaction", (tx) => {
            console.log("newTransaction received:", tx);
            const date = new Date(tx.timestamp);
            const formattedDate = date.toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
            console.log("TransactionList - New Transaction timestamp (KST):", formattedDate, "Raw timestamp:", tx.timestamp);
            const formatted = {
                time: formattedDate,
                type: tx.type === "buy" ? "매수" : "매도",
                amount: tx.token_amount,
                bnbValue: tx.bnb_value,
            };
            setTransactions(prev => [formatted, ...prev.slice(0, 99)]);
        });

        socket.on("connect", () => {
            console.log("Socket.IO connected");
            socket.emit("joinTokenRoom", tokenAddress);
        });

        socket.on("disconnect", () => {
            console.log("Socket.IO disconnected");
        });

        return () => {
            socket.off("newTransaction");
            socket.off("connect");
            socket.off("disconnect");
        };
    }, [tokenAddress]);

    return (
        <div className="overflow-x-auto">
            {loading && <div className="mb-4 p-2 bg-blue-600 rounded">로딩 중...</div>}
            {error && <div className="mb-4 p-2 bg-red-600 rounded">{error}</div>}
            {transactions.length === 0 && !loading && !error && (
                <div className="mb-4 p-2 bg-gray-600 rounded">트랜잭션이 없습니다.</div>
            )}
            {transactions.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2 text-left">시간</th>
                            <th className="p-2 text-left">유형</th>
                            <th className="p-2 text-left">수량</th>
                            <th className="p-2 text-left">BNB</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, index) => (
                            <tr key={index} className="border-b border-gray-700">
                                <td className="p-2">{tx.time}</td>
                                <td className={`p-2 ${tx.type === "매수" ? "text-green-500" : "text-red-500"}`}>{tx.type}</td>
                                <td className="p-2">{tx.amount}</td>
                                <td className="p-2">{tx.bnbValue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TransactionList;

//직무 지원직무는 ~~한 업무를 ~~를 담당
//이러한 직무를 수행하기위해 필요한 지식은 ~~, ~~역량필요
// 이러한 지식을 함양하기위해 ~~ㅇ