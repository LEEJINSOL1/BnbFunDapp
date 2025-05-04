import React, { useState } from "react";
import { ethers } from "ethers";
import TokenFactoryABI from "../abis/TokenFactory.json";
import PresaleABI from "../abis/Presale.json";

const TOKEN_FACTORY_ADDRESS = "0x6A4170Af52417CF39df57de2Df3e29a4D994cc8C";
const PRESALE_ADDRESS = "0x874aa4Bf234e140876232D0BeaEd39F68F7C13Ec";

const TradePanel = ({ account, signer, selectedToken, setTokens }) => {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [bnbAmount, setBnbAmount] = useState("");
    const [sellAmount, setSellAmount] = useState("");
    const [error, setError] = useState("");

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateToken = async () => {
        const trimmedName = name.trim();
        const trimmedSymbol = symbol.trim();
        if (!trimmedName || !trimmedSymbol || !image) {
            setError("모든 필드를 입력하세요.");
            return;
        }

        try {
            const tokenFactory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TokenFactoryABI, signer);
            const tx = await tokenFactory.createToken(trimmedName, trimmedSymbol, {
                value: ethers.utils.parseEther("0.01"),
                gasLimit: 1500000,
            });
            const receipt = await tx.wait();

            // 이벤트 로그 출력
            console.log("이벤트 로그:", receipt.events);

            // TokenCreated 이벤트 찾기
            const event = receipt.events.find(e => e.event === "TokenCreated");
            if (!event) {
                throw new Error("토큰 생성 실패: TokenCreated 이벤트를 찾을 수 없습니다.");
            }

            const { tokenAddress, name: eventName, symbol: eventSymbol, createdAt } = event.args;
            setTokens(prev => [...prev, {
                address: tokenAddress,
                name: eventName,
                symbol: eventSymbol,
                createdAt: new Date(parseInt(createdAt) * 1000).toLocaleString(),
                raisedFunds: "0 BNB",
                volume: "0 BNB",
            }]);
            setError("");
        } catch (err) {
            console.error("토큰 생성 실패:", err);
            setError("토큰 생성 실패: " + (err.message || "알 수 없는 에러"));
        }
    };

    const handleBuy = async () => {
        if (!selectedToken || !bnbAmount) {
            setError("토큰과 BNB 금액을 입력하세요.");
            return;
        }

        try {
            const presale = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, signer);
            const tx = await presale.buyTokens(selectedToken.address, {
                value: ethers.utils.parseEther(bnbAmount),
            });
            await tx.wait();
            setError("");
        } catch (err) {
            console.error("매수 실패:", err);
            setError("매수 실패: " + (err.message || "알 수 없는 에러"));
        }
    };

    const handleSell = async () => {
        if (!selectedToken || !sellAmount) {
            setError("토큰과 판매 수량을 입력하세요.");
            return;
        }

        try {
            const presale = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, signer);
            const token = new ethers.Contract(selectedToken.address, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);
            await token.approve(PRESALE_ADDRESS, ethers.utils.parseUnits(sellAmount, 18));
            const tx = await presale.sellTokens(selectedToken.address, ethers.utils.parseUnits(sellAmount, 18));
            await tx.wait();
            setError("");
        } catch (err) {
            console.error("매도 실패:", err);
            setError("매도 실패: " + (err.message || "알 수 없는 에러"));
        }
    };

    return (
        <div>
            {error && <div className="mb-4 p-2 bg-red-600 rounded">{error}</div>}
            <div className="mb-4">
                <h3 className="text-lg mb-2">토큰 생성</h3>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="토큰 이름"
                    className="w-full p-2 mb-2 bg-gray-700 rounded"
                />
                <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="토큰 심볼"
                    className="w-full p-2 mb-2 bg-gray-700 rounded"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 mb-2 bg-gray-700 rounded"
                />
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full mb-2" />}
                <button
                    onClick={handleCreateToken}
                    className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
                >
                    토큰 생성 (0.01 BNB)
                </button>
            </div>
            <div>
                <h3 className="text-lg mb-2">프리세일 거래</h3>
                <div className="flex space-x-2">
                    <div className="w-1/2">
                        <input
                            type="text"
                            value={bnbAmount}
                            onChange={(e) => setBnbAmount(e.target.value)}
                            placeholder="BNB 금액"
                            className="w-full p-2 mb-2 bg-gray-700 rounded"
                        />
                        <button
                            onClick={handleBuy}
                            className="w-full bg-green-600 p-2 rounded hover:bg-green-500"
                        >
                            매수
                        </button>
                    </div>
                    <div className="w-1/2">
                        <input
                            type="text"
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                            placeholder="토큰 수량"
                            className="w-full p-2 mb-2 bg-gray-700 rounded"
                        />
                        <button
                            onClick={handleSell}
                            className="w-full bg-red-600 p-2 rounded hover:bg-red-500"
                        >
                            매도
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradePanel;