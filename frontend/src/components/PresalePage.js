import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale } from "chart.js";
import PresaleABI from "../abis/Presale.json";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale);

const PresalePage = ({ signer, tokens }) => {
  const { tokenAddress } = useParams();
  const [presaleAddress, setPresaleAddress] = useState("");
  const [currentRate, setCurrentRate] = useState(0);
  const [totalBNB, setTotalBNB] = useState(0);
  const [bnbAmount, setBnbAmount] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [userContribution, setUserContribution] = useState(0);
  const [userTokens, setUserTokens] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (signer && tokenAddress && tokens) {
      fetchPresaleAddress();
    }
  }, [signer, tokenAddress, tokens]);

  const fetchPresaleAddress = async () => {
    try {
      console.log("Tokens received in PresalePage:", tokens);
      const tokenData = tokens.find((t) => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
      console.log("Found token data:", tokenData);
      if (tokenData && tokenData.presaleAddress) {
        setPresaleAddress(tokenData.presaleAddress);
        fetchPresaleData(tokenData.presaleAddress);
      } else {
        setError("Presale address not found in local token list.");
      }
    } catch (error) {
      console.error("Error fetching presale address:", error);
      setError("Failed to fetch presale address: " + error.message);
    }
  };

  const fetchPresaleData = async (presaleAddr) => {
    try {
      const presaleContract = new ethers.Contract(presaleAddr, PresaleABI, signer);
      const rate = await presaleContract.getCurrentRate();
      const bnbRaised = await presaleContract.totalBNB();
      const userAddr = await signer.getAddress();
      const contribution = await presaleContract.contributions(userAddr);
      const tokensBought = await presaleContract.tokenBalances(userAddr);

      setCurrentRate(ethers.formatUnits(rate, 18));
      setTotalBNB(ethers.formatEther(bnbRaised));
      setUserContribution(ethers.formatEther(contribution));
      setUserTokens(ethers.formatUnits(tokensBought, 18));

      const history = [10_000_000, 9_500_000, 9_000_000, 8_500_000, 8_000_000].map((r) =>
        ethers.formatUnits(r, 18)
      );
      setPriceHistory(history);
    } catch (error) {
      console.error("Error fetching presale data:", error);
      setError("Failed to load presale data: " + error.message);
    }
  };

  const handleBuy = async () => {
    if (!signer || !bnbAmount || bnbAmount <= 0) {
      setError("Please enter a valid BNB amount.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const presaleContract = new ethers.Contract(presaleAddress, PresaleABI, signer);
      const tx = await presaleContract.buyTokens({
        value: ethers.parseEther(bnbAmount),
        gasLimit: 300000,
      });
      await tx.wait();
      await fetchPresaleData(presaleAddress);
      setBnbAmount("");
    } catch (error) {
      setError("Buy failed: " + error.message);
    }
    setLoading(false);
  };

  const handleRefund = async () => {
    if (!signer || userContribution <= 0) {
      setError("No contribution to refund.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const presaleContract = new ethers.Contract(presaleAddress, PresaleABI, signer);
      const token = new ethers.Contract(tokenAddress, ["function approve(address spender, uint256 amount) external returns (bool)"], signer);
      await token.approve(presaleAddress, ethers.parseUnits(userTokens, 18));
      const tx = await presaleContract.refund({ gasLimit: 300000 });
      await tx.wait();
      await fetchPresaleData(presaleAddress);
    } catch (error) {
      setError("Refund failed: " + error.message);
    }
    setLoading(false);
  };

  const chartData = {
    labels: ["-4h", "-3h", "-2h", "-1h", "Now"],
    datasets: [
      {
        label: "Tokens per BNB",
        data: priceHistory,
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false,
      },
    ],
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl mb-4">Presale for Token {tokenAddress.slice(0, 6)}...</h2>
      {error && <div className="mb-4 p-2 bg-red-600 text-white rounded">{error}</div>}
      {presaleAddress ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg mb-2">Price History</h3>
            <Line data={chartData} />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg mb-2">Presale Details</h3>
            <p>Current Rate: 1 BNB = {Number(currentRate).toLocaleString()} Tokens</p>
            <p>Total BNB Raised: {Number(totalBNB).toFixed(2)} BNB</p>
            <p>Your Contribution: {Number(userContribution).toFixed(4)} BNB</p>
            <p>Your Tokens: {Number(userTokens).toLocaleString()} Tokens</p>
            <input
              type="number"
              value={bnbAmount}
              onChange={(e) => setBnbAmount(e.target.value)}
              placeholder="Enter BNB amount"
              className="w-full p-2 bg-gray-700 rounded mb-2 text-white"
              disabled={loading}
            />
            <button
              onClick={handleBuy}
              className="bg-blue-600 px-4 py-2 rounded w-full mb-2 hover:bg-blue-500 disabled:bg-gray-500"
              disabled={loading}
            >
              {loading ? "Processing..." : "Buy Now"}
            </button>
            <button
              onClick={handleRefund}
              className="bg-red-600 px-4 py-2 rounded w-full hover:bg-red-500 disabled:bg-gray-500"
              disabled={loading || userContribution <= 0}
            >
              {loading ? "Processing..." : "Refund"}
            </button>
          </div>
        </div>
      ) : (
        <p>Loading presale data...</p>
      )}
    </div>
  );
};

export default PresalePage;