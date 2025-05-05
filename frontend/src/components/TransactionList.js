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
            try {
                const response = await axios.get(`http://localhost:5000/api/transactions/${tokenAddress}`);
                const txs = response.data.map(tx => ({
                    time: new Date(tx.timestamp).toLocaleString(),
                    type: tx.type === "buy" ? "매수" : "매도",
                    amount: tx.token_amount,
                    bnbValue: tx.bnb_value,
                }));
                setTransactions(txs);
            } catch (err) {
                console.error("트랜잭션 불러오기 실패:", err);
                setError("트랜잭션 데이터를 불러오지 못했습니다.");
            }
            setLoading(false);
        };

        fetchTransactions();
        socket.emit("joinTokenRoom", tokenAddress);

        socket.on("newTransaction", (tx) => {
            const formatted = {
                time: new Date(tx.timestamp).toLocaleString(),
                type: tx.type === "buy" ? "매수" : "매도",
                amount: tx.amount,
                bnbValue: tx.bnbValue,
            };
            setTransactions(prev => [formatted, ...prev]);
        });

        return () => {
            socket.off("newTransaction");
        };
    }, [tokenAddress]);

    return (
        <div className="overflow-x-auto">
            {loading && <div className="mb-4 p-2 bg-blue-600 rounded">로딩 중...</div>}
            {error && <div className="mb-4 p-2 bg-red-600 rounded">{error}</div>}
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
        </div>
    );
};

export default TransactionList;