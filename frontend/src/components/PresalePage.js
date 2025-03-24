import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale);

const PresalePage = ({ token }) => {
  const data = {
    labels: ["1h", "2h", "3h", "4h", "5h"],
    datasets: [
      {
        label: "Price (BNB)",
        data: [0.0001, 0.00011, 0.000121, 0.000133, 0.000146], // 더미 데이터
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false,
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">{token?.name} Presale</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 차트 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <Line data={data} />
        </div>
        {/* 구매 UI */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg mb-2">Buy Tokens</h3>
          <p>Current Price: 1 BNB = 10M Tokens</p>
          <input
            type="number"
            placeholder="Enter BNB amount"
            className="w-full p-2 bg-gray-700 rounded mb-2"
          />
          <button className="bg-blue-600 px-4 py-2 rounded w-full">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresalePage;