import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ethers } from "ethers";
import PresaleABI from "../abis/Presale.json";
import "chartjs-adapter-date-fns";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import axios from "axios";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FundingChart = ({ tokenAddress }) => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
    });

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/transactions/${tokenAddress}`);
                const transactions = response.data;

                // 시간별 데이터 집계
                const labels = [];
                const raisedFundsData = [];
                const volumeData = [];
                let currentRaisedFunds = 0;
                let currentVolume = 0;

                // 최근 6개 시간 포인트 (5분 간격)
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
                    labels.push(time.toLocaleTimeString());

                    // 해당 시간 이전의 트랜잭션 합계 계산
                    const pastTransactions = transactions.filter(tx => new Date(tx.timestamp) <= time);
                    currentRaisedFunds = pastTransactions
                        .filter(tx => tx.type === 'buy')
                        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                    currentVolume = pastTransactions
                        .filter(tx => tx.type === 'sell')
                        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

                    raisedFundsData.push(currentRaisedFunds);
                    volumeData.push(currentVolume);
                }

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: "프리세일 모금액 (BNB)",
                            data: raisedFundsData,
                            borderColor: "rgba(75, 192, 192, 1)",
                            backgroundColor: "rgba(75, 192, 192, 0.2)",
                            fill: true,
                        },
                        {
                            label: "거래대금 (BNB)",
                            data: volumeData,
                            borderColor: "rgba(255, 99, 132, 1)",
                            backgroundColor: "rgba(255, 99, 132, 0.2)",
                            fill: true,
                        },
                    ],
                });
            } catch (err) {
                console.error("차트 데이터 가져오기 실패:", err);
                setChartData({
                    labels: [],
                    datasets: [],
                });
            }
        };
        fetchChartData();
    }, [tokenAddress]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "프리세일 차트",
            },
        },
    };

    return <Line data={chartData} options={options} />;
};

export default FundingChart;