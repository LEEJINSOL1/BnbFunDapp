// src/components/TradePanel.js
import React, { useState } from "react";
import { ethers } from "ethers";
import TokenFactoryABI from "../abis/TokenFactory.json";
import PresaleABI       from "../abis/Presale.json";
import axios            from "axios";

const TOKEN_FACTORY_ADDRESS = "0x6A4170Af52417CF39df57de2Df3e29a4D994cc8C";
const PRESALE_ADDRESS       = "0x874aa4Bf234e140876232D0BeaEd39F68F7C13Ec";

/**
 * Pinata에 파일을 업로드하고 CID를 반환합니다.
 * 환경변수 REACT_APP_PINATA_JWT 에 발급받은 JWT를 설정해야 합니다.
 */
const uploadToPinata = async (file) => {
  const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
  if (!PINATA_JWT) {
    throw new Error("Missing REACT_APP_PINATA_JWT in .env");
  }
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }
  const { IpfsHash } = await res.json();
  return IpfsHash;
};

const TradePanel = ({ account, signer, selectedToken, setTokens }) => {
  const [name, setName]                   = useState("");
  const [symbol, setSymbol]               = useState("");
  const [image, setImage]                 = useState(null);
  const [imagePreview, setImagePreview]   = useState("");
  const [bnbAmount, setBnbAmount]         = useState("");
  const [sellAmount, setSellAmount]       = useState("");
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");

  // 이미지 선택 시 미리보기 생성
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // 백엔드에서 토큰 목록 조회
  const fetchTokens = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/tokens");
      const tokens = data.map((t) => ({
        address:     t.token_address,
        name:        t.name,
        symbol:      t.symbol,
        image_url:   t.image_url,
        createdAt:   new Date(t.created_at).toLocaleString("ko-KR", { timeZone: "UTC" }),
        raisedFunds: t.raised_funds,
        volume:      t.volume,
      }));
      setTokens(tokens);
    } catch (err) {
      console.error("토큰 목록 가져오기 실패", err);
      setError("토큰 목록 가져오기 실패: " + (err.message || "알 수 없는 에러"));
    }
  };

  // 토큰 생성 핸들러
  const handleCreateToken = async () => {
    const nm  = name.trim();
    const sym = symbol.trim();
    if (!nm || !sym) {
      setError("토큰 이름과 심볼을 입력하세요.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      // 1) Pinata에 이미지 업로드
      let imageUrl = null;
      if (image) {
        const cid = await uploadToPinata(image);
        imageUrl   = `https://gateway.pinata.cloud/ipfs/${cid}`;
      }

      // 2) 스마트컨트랙트로 토큰 생성
      const factory = new ethers.Contract(
        TOKEN_FACTORY_ADDRESS,
        TokenFactoryABI,
        signer
      );
      const tx = await factory.createToken(nm, sym, {
        value:    ethers.utils.parseEther("0.01"),
        gasLimit: 1500000,
      });
      console.log("Create Token TX HASH:", tx.hash);
      const receipt = await tx.wait();
      console.log("Create Token RECEIPT:", receipt);

      // 3) TokenCreated 이벤트에서 정보 추출
      const ev = receipt.events.find((e) => e.event === "TokenCreated");
      if (!ev) throw new Error("TokenCreated 이벤트를 찾을 수 없습니다.");
      const { tokenAddress, name: evName, symbol: evSym, createdAt } = ev.args;
      

      const raw = new Date(parseInt(createdAt, 10) * 1000);
      const created_iso = raw
        .toISOString()      // "2025-05-26T15:13:38.000Z"
        .slice(0, 19)       // "2025-05-26T15:13:38"
        .replace("T", " "); // "2025-05-26 15:13:38"

      // 4) 백엔드에 저장할 페이로드 구성
      const payload = {
        token_address: tokenAddress,
        name:           evName,
        symbol:         evSym,
        created_at:     created_iso,
        raised_funds:   "0 BNB",
        volume:         "0 BNB",
        image_url:      imageUrl,
      };
      await axios.post("http://localhost:5000/api/tokens", payload);

      // 5) UI 갱신
      await fetchTokens();
      setSuccess("토큰이 성공적으로 생성되었습니다.");
      setTimeout(() => setSuccess(""), 3000);

      // 6) 입력 초기화
      setName("");
      setSymbol("");
      setImage(null);
      setImagePreview("");
    } catch (err) {
      console.error("토큰 생성 실패", err);
      setError("토큰 생성 실패: " + (err.message || "알 수 없는 에러"));
    }
  };

  // 매수 핸들러
  const handleBuy = async () => {
    const amount = parseFloat(bnbAmount);
    if (!selectedToken || !bnbAmount || isNaN(amount) || amount <= 0 || amount > 1000) {
      setError("유효한 토큰과 BNB 금액(0 초과, 최대 1000 BNB)을 입력하세요.");
      return;
    }

    let utcTimestamp = new Date().toISOString();
    try {
      setError("");
      setSuccess("");
      const presale = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, signer);
      const tx = await presale.buyTokens(selectedToken.address, {
        value:    ethers.utils.parseEther(bnbAmount),
        gasLimit: 300000,
      });
      console.log("Buy TX HASH:", tx.hash);
      const receipt = await tx.wait();
      console.log("Buy RECEIPT:", receipt);

      const event = receipt.events.find((e) => e.event === "TokenBought");
      if (!event) throw new Error("TokenBought 이벤트를 찾을 수 없습니다.");

      const { token, amount: tokenAmount, bnbValue } = event.args;
      const block = await signer.provider.getBlock(receipt.blockNumber);
      utcTimestamp = new Date(block.timestamp * 1000).toISOString();

      const buyPayload = {
        token_address: token,
        type:          "buy",
        token_amount:  ethers.utils.formatUnits(tokenAmount, 18),
        bnb_value:     ethers.utils.formatEther(bnbValue),
        timestamp:     utcTimestamp,
      };
      console.log("Buy payload:", buyPayload);

      await axios.post("http://localhost:5000/api/transactions", buyPayload);
      await fetchTokens();
      setSuccess("매수가 성공적으로 처리되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      setBnbAmount("");
    } catch (err) {
      console.error("매수 실패:", err);
      setError(
        `매수 실패: ${err.response?.data?.error || err.reason || err.message || "서버 에러"}`
      );
    }
  };

  // 매도 핸들러
  const handleSell = async () => {
    const amount = parseFloat(sellAmount);
    if (!selectedToken || !sellAmount || isNaN(amount) || amount <= 0 || amount > 1000000) {
      setError("유효한 토큰과 판매 수량(0 초과, 최대 1,000,000 토큰)을 입력하세요.");
      return;
    }

    let utcTimestamp = new Date().toISOString();
    try {
      setError("");
      setSuccess("");
      const presale = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, signer);
      const token   = new ethers.Contract(
        selectedToken.address,
        ["function approve(address spender, uint256 amount) public returns (bool)"],
        signer
      );
      const approveTx = await token.approve(
        PRESALE_ADDRESS,
        ethers.utils.parseUnits(sellAmount, 18)
      );
      console.log("Approve TX HASH:", approveTx.hash);
      await approveTx.wait();

      const tx = await presale.sellTokens(
        selectedToken.address,
        ethers.utils.parseUnits(sellAmount, 18),
        { gasLimit: 300000 }
      );
      console.log("Sell TX HASH:", tx.hash);
      const receipt = await tx.wait();
      console.log("Sell RECEIPT:", receipt);

      const event = receipt.events.find((e) => e.event === "TokenSold");
      if (!event) throw new Error("TokenSold 이벤트를 찾을 수 없습니다.");

      const { token: tokenAddress, amount: tokenAmount, bnbValue } = event.args;
      const block = await signer.provider.getBlock(receipt.blockNumber);
      utcTimestamp = new Date(block.timestamp * 1000).toISOString();

      const sellPayload = {
        token_address: tokenAddress,
        type:          "sell",
        token_amount:  ethers.utils.formatUnits(tokenAmount, 18),
        bnb_value:     ethers.utils.formatEther(bnbValue),
        timestamp:     utcTimestamp,
      };
      console.log("Sell payload:", sellPayload);

      await axios.post("http://localhost:5000/api/transactions", sellPayload);
      await fetchTokens();
      setSuccess("매도가 성공적으로 처리되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
      setSellAmount("");
    } catch (err) {
      console.error("매도 실패:", err);
      setError(
        `매도 실패: ${err.response?.data?.error || err.reason || err.message || "서버 에러"}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {error   && <div className="p-2 bg-red-600 rounded">{error}</div>}
      {success && <div className="p-2 bg-green-600 rounded">{success}</div>}

      {/* 토큰 생성 폼 */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-blue-400">토큰 생성</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="토큰 이름"
          className="w-full p-2 mb-2 bg-gray-700 rounded text-white"
        />
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="토큰 심볼"
          className="w-full p-2 mb-2 bg-gray-700 rounded text-white"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 mb-2 bg-gray-700 rounded text-white"
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-16 h-16 rounded-full mb-2 object-cover"
          />
        )}
        <button
          onClick={handleCreateToken}
          disabled={!account}
          className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500"
        >
          토큰 생성 (0.01 BNB)
        </button>
      </div>

      {/* 프리세일 거래 폼 */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-blue-400">프리세일 거래</h3>
        <div className="flex space-x-4">
          <div className="w-1/2">
            <input
              type="text"
              value={bnbAmount}
              onChange={(e) => setBnbAmount(e.target.value)}
              placeholder="BNB 금액"
              className="w-full p-2 mb-2 bg-gray-700 rounded text-white placeholder-gray-400"
            />
            <button
              onClick={handleBuy}
              className="w-full bg-green-600 p-2 rounded hover:bg-green-500 transition-colors"
              disabled={!account || !selectedToken}
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
              className="w-full p-2 mb-2 bg-gray-700 rounded text-white placeholder-gray-400"
            />
            <button
              onClick={handleSell}
              className="w-full bg-red-600 p-2 rounded hover:bg-red-500 transition-colors"
              disabled={!account || !selectedToken}
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
