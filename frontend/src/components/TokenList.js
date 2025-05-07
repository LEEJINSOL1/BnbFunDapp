import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const TokenList = ({ tokens, setTokens, onSelect, provider, selectedToken }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("raisedFunds");
  const [sortOrder, setSortOrder] = useState("desc");

  // 데이터 조회 및 초기 토큰 선택
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/tokens");
        console.log("API 응답 데이터:", response.data);
        const tokenList = response.data.map((token) => ({
          address: token.token_address,
          name: token.name,
          symbol: token.symbol,
          createdAt: new Date(token.created_at).toLocaleString(),
          raisedFunds: token.raised_funds,
          volume: token.volume,
        }));
        setTokens(tokenList);
        setError("");

        // 초기 토큰 선택: 프리세일 모금액이 가장 높은 토큰
        if (tokenList.length > 0) {
          const sorted = [...tokenList].sort((a, b) => {
            const valueA = parseFloat(a.raisedFunds.replace(" BNB", ""));
            const valueB = parseFloat(b.raisedFunds.replace(" BNB", ""));
            return valueB - valueA; // 내림차순
          });
          onSelect(sorted[0]); // 첫 번째 토큰 선택
        }
      } catch (err) {
        console.error("토큰 목록 가져오기 실패:", err);
        setError("토큰 목록을 가져오지 못했습니다: " + (err.message || "알 수 없는 에러"));
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, [setTokens, onSelect]);

  // 기본 정렬 설정
  useEffect(() => {
    setSortKey("raisedFunds");
    setSortOrder("desc");
  }, []);

  // 정렬 핸들러
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // 정렬된 토큰 목록
  const sortedTokens = useMemo(() => {
    const sorted = [...tokens];
    if (!sortKey) return sorted;

    sorted.sort((a, b) => {
      let valueA, valueB;
      if (sortKey === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else if (sortKey === "createdAt") {
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      } else {
        valueA = a[sortKey].includes("BNB") ? parseFloat(a[sortKey].replace(" BNB", "")) : 0;
        valueB = b[sortKey].includes("BNB") ? parseFloat(b[sortKey].replace(" BNB", "")) : 0;
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      }
    });
    return sorted;
  }, [tokens, sortKey, sortOrder]);

  // 정렬 아이콘
  const getSortIcon = (key) => {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <div className="overflow-x-auto">
      {loading && <div className="mb-4 p-2 bg-blue-600 rounded">로딩 중...</div>}
      {error && <div className="mb-4 p-2 bg-red-600 rounded">{error}</div>}
      {sortedTokens.length === 0 && !loading && (
        <div className="p-2 text-gray-400">토큰 데이터가 없습니다.</div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-2 text-left cursor-pointer hover:text-blue-400" onClick={() => handleSort("name")}>
              토큰명 {getSortIcon("name")}
            </th>
            <th
              className="p-2 text-left cursor-pointer hover:text-blue-400"
              onClick={() => handleSort("createdAt")}
            >
              생성 시간 {getSortIcon("createdAt")}
            </th>
            <th className="p-2 text-left cursor-pointer hover:text-blue-400" onClick={() => handleSort("volume")}>
              거래대금 {getSortIcon("volume")}
            </th>
            <th
              className="p-2 text-left cursor-pointer hover:text-blue-400"
              onClick={() => handleSort("raisedFunds")}
            >
              프리세일 모금액 {getSortIcon("raisedFunds")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTokens.map((token, index) => (
            <tr
              key={index}
              className={`border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${
                selectedToken && selectedToken.address === token.address ? "bg-blue 江门700" : ""
              }`}
              onClick={() => onSelect(token)}
            >
              <td className="p-2">
                {token.name} ({token.symbol})
              </td>
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