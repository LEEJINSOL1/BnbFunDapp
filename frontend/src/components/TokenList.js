import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

const TokenList = ({ tokens, setTokens, onSelect, provider }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:5000/api/tokens");
                console.log("API 응답 데이터:", response.data);
                const tokenList = response.data.map(token => ({
                    address: token.token_address,
                    name: token.name,
                    symbol: token.symbol,
                    createdAt: new Date(token.created_at).toLocaleString(),
                    raisedFunds: token.raised_funds,
                    volume: token.volume,
                }));
                setTokens(tokenList);
                setError("");
                setLoading(false);
            } catch (err) {
                console.error("토큰 목록 가져오기 실패:", err);
                setError("토큰 목록을 가져오지 못했습니다: " + (err.message || "알 수 없는 에러"));
                setLoading(false);
            }
        };
        fetchTokens();
    }, [setTokens]); // setTokens 의존성 추가

    return (
        <div className="overflow-x-auto">
            {loading && <div className="mb-4 p-2 bg-blue-600 rounded">로딩 중...</div>}
            {error && <div className="mb-4 p-2 bg-red-600 rounded">{error}</div>}
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="p-2 text-left">토큰명</th>
                        <th className="p-2 text-left">생성 시간</th>
                        <th className="p-2 text-left">거래대금</th>
                        <th className="p-2 text-left">프리세일 모금액</th>
                    </tr>
                </thead>
                <tbody>
                    {tokens.map((token, index) => (
                        <tr
                            key={index}
                            className="border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
                            onClick={() => onSelect(token)}
                        >
                            <td className="p-2">{token.name} ({token.symbol})</td>
                            <td className="p-2">{token.createdAt}</td>
                            <td className="p-2">{token.volume}</td>
                            <td className="p-2">{token.raisedFunds}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TokenList;