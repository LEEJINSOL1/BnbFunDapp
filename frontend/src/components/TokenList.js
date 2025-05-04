import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import TokenFactoryABI from "../abis/TokenFactory.json";

const TOKEN_FACTORY_ADDRESS = "0x6A4170Af52417CF39df57de2Df3e29a4D994cc8C";
const BSC_TESTNET_RPC = "https://bnb-testnet.g.alchemy.com/v2/eUBN5ikzipXVk36mLLmrWun9lBGFejZ0";

const TokenList = ({ tokens, setTokens, onSelect, provider }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true); // 로딩 상태 추가

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                setLoading(true); // 로딩 시작
                const customProvider = provider || new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);
                const tokenFactory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TokenFactoryABI, customProvider);
                const latestBlock = await customProvider.getBlockNumber();
                const blockRange = 50;
                let allEvents = [];
                for (let i = latestBlock; i > Math.max(latestBlock - 1000, 0); i -= blockRange) {
                    const fromBlock = Math.max(i - blockRange, 0);
                    const toBlock = i;
                    const filter = tokenFactory.filters.TokenCreated();
                    const events = await tokenFactory.queryFilter(filter, fromBlock, toBlock);
                    allEvents = [...allEvents, ...events];
                }

                if (allEvents.length === 0) {
                    setError("최근 1,000 블록 내 생성된 토큰이 없습니다.");
                    setTokens([]);
                    setLoading(false);
                    return;
                }

                const blockNumbers = [...new Set(allEvents.map(event => event.blockNumber))];
                const blocks = await Promise.all(
                    blockNumbers.map(blockNumber => customProvider.getBlock(blockNumber))
                );
                const blockMap = blocks.reduce((map, block) => {
                    map[block.number] = block;
                    return map;
                }, {});

                const tokenList = allEvents.map(event => {
                    const block = blockMap[event.blockNumber];
                    return {
                        address: event.args.tokenAddress,
                        name: event.args.name,
                        symbol: event.args.symbol,
                        createdAt: new Date(block.timestamp * 1000).toLocaleString(),
                        raisedFunds: "0 BNB",
                        volume: "0 BNB",
                    };
                });

                setTokens(tokenList);
                setError("");
                setLoading(false); // 로딩 완료
            } catch (err) {
                console.error("토큰 목록 가져오기 실패:", err);
                setError("토큰 목록을 가져오지 못했습니다: " + (err.message || "알 수 없는 에러"));
                setLoading(false);
            }
        };
        fetchTokens();
    }, [provider]);

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