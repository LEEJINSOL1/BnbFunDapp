import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import PresaleABI from "../abis/Presale.json";

const PRESALE_ADDRESS = "0x874aa4Bf234e140876232D0BeaEd39F68F7C13Ec";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";

const TransactionList = ({ tokenAddress }) => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);
                const presale = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, provider);
                const latestBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(latestBlock - 10000, 0);

                const buyFilter = presale.filters.TokenBought(tokenAddress);
                const sellFilter = presale.filters.TokenSold(tokenAddress);
                const buyEvents = await presale.queryFilter(buyFilter, fromBlock, latestBlock);
                const sellEvents = await presale.queryFilter(sellFilter, fromBlock, latestBlock);

                const txs = [
                    ...buyEvents.map(event => ({
                        time: new Date(event.blockTimestamp * 1000).toLocaleString(),
                        type: "매수",
                        amount: ethers.utils.formatUnits(event.args.amount, 18),
                        bnbValue: ethers.utils.formatEther(event.args.bnbValue),
                    })),
                    ...sellEvents.map(event => ({
                        time: new Date(event.blockTimestamp * 1000).toLocaleString(),
                        type: "매도",
                        amount: ethers.utils.formatUnits(event.args.amount, 18),
                        bnbValue: ethers.utils.formatEther(event.args.bnbValue),
                    })),
                ].sort((a, b) => new Date(b.time) - new Date(a.time));

                setTransactions(txs);
            } catch (err) {
                console.error("트랜잭션 목록 가져오기 실패:", err);
            }
        };
        if (tokenAddress) fetchTransactions();
    }, [tokenAddress]);

    return (
        <div className="overflow-x-auto">
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