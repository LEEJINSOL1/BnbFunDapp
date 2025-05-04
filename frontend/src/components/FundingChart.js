import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ethers } from "ethers";
import PresaleABI from "../abis/Presale.json";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend);

const PRESALE_ADDRESS = "0x874aa4Bf234e140876232D0BeaEd39F68F7C13Ec";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";

const FundingChart = ({ tokenAddress }) => {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        const fetchFundingData = async () => {
            try {
                const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);
                const presale = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, provider);
                const latestBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(latestBlock - 10000, 0);

                const filter = presale.filters.TokenBought(tokenAddress);
                const events = await presale.queryFilter(filter, fromBlock, latestBlock);

                let cumulativeBnb = 0;
                const dataPoints = events.map(event => {
                    cumulativeBnb += parseFloat(ethers.utils.formatEther(event.args.bnbValue));
                    return { x: new Date(event.blockTimestamp * 1000), y: cumulativeBnb };
                });

                setChartData({
                    labels: dataPoints.map(dp => dp.x),
                    datasets: [
                        {
                            label: "프리세일 모금액 (BNB)",
                            data: dataPoints.map(dp => dp.y),
                            borderColor: "rgba(75, 192, 192, 1)",
                            fill: false,
                        },
                    ],
                });
            } catch (err) {
                console.error("차트 데이터 가져오기 실패:", err);
            }
        };
        if (tokenAddress) fetchFundingData();
    }, [tokenAddress]);

    return (
        <div>
            <Line
                data={chartData}
                options={{
                    scales: {
                        x: {
                            type: "time",
                            time: {
                                unit: "minute",
                                displayFormats: { minute: "HH:mm" },
                            },
                            title: { display: true, text: "시간" },
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: "모금액 (BNB)" },
                        },
                    },
                }}
            />
        </div>
    );
};

export default FundingChart;