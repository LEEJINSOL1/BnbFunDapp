import React, { useState } from "react";
import { ethers } from "ethers";
import TokenFactoryABI from "../abis/TokenFactory.json";

const TOKEN_FACTORY_ADDRESS = "0x6A4170Af52417CF39df57de2Df3e29a4D994cc8C";

const CreateTokenModal = ({ onClose, onCreate, signer }) => {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [error, setError] = useState("");

    const validateInputs = () => {
        const trimmedName = name.trim();
        const trimmedSymbol = symbol.trim();

        if (!trimmedName) return "Token name cannot be empty.";
        if (trimmedName.length < 3) return "Token name must be at least 3 characters.";
        if (trimmedName.length > 30) return "Token name must be 30 characters or less.";
        if (/^\d+$/.test(trimmedName)) return "Token name cannot consist of only numbers.";

        if (!trimmedSymbol) return "Token symbol cannot be empty.";
        if (trimmedSymbol.length < 2) return "Token symbol must be at least 2 characters.";
        if (trimmedSymbol.length > 5) return "Token symbol must be 5 characters or less.";
        if (!/^[A-Z0-9]+$/.test(trimmedSymbol)) return "Token symbol must contain only uppercase letters and numbers.";
        if (/^\d+$/.test(trimmedSymbol)) return "Token symbol cannot consist of only numbers.";

        if (!image) return "Please upload a token image.";

        return "";
    };

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

    const handleSubmit = async () => {
        console.log("Button clicked! Starting handleSubmit");

        const trimmedName = name.trim();
        const trimmedSymbol = symbol.trim();
        console.log("Raw inputs:", { name, symbol });
        console.log("Trimmed inputs:", { trimmedName, trimmedSymbol });

        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            console.log("Validation failed:", validationError);
            return;
        }

        if (!signer) {
            setError("Please connect your wallet first.");
            console.log("No signer provided!");
            return;
        }

        console.log("Signer found:", await signer.getAddress());
        try {
            const tokenFactory = new ethers.Contract(
                TOKEN_FACTORY_ADDRESS,
                TokenFactoryABI,
                signer
            );

            console.log("Sending to createToken:");
            console.log("Name:", trimmedName);
            console.log("Symbol:", trimmedSymbol);
            console.log("Value (wei):", ethers.utils.parseEther("0.01").toString());

            const data = tokenFactory.interface.encodeFunctionData("createToken", [trimmedName, trimmedSymbol]);
            console.log("Encoded transaction data:", data);

            const tx = await tokenFactory.createToken(trimmedName, trimmedSymbol, {
                value: ethers.utils.parseEther("0.01"),
                gasLimit: 1500000, // 증가
            });
            console.log("Transaction sent! Hash:", tx.hash);
            console.log("Transaction data (sent):", tx.data);

            const receipt = await tx.wait();
            console.log("Transaction confirmed! Receipt:", receipt);

            const event = receipt.logs.find((log) => {
                try {
                    const parsedLog = tokenFactory.interface.parseLog(log);
                    return parsedLog.name === "TokenCreated";
                } catch (err) {
                    return false;
                }
            });
            const tokenAddress = event.args.tokenAddress;

            setError("");
            const token = {
                name: trimmedName,
                symbol: trimmedSymbol.toUpperCase(),
                address: tokenAddress,
                image: imagePreview,
            };
            onCreate(token);
            onClose();
        } catch (err) {
            console.error("Error details:", err);
            setError("Transaction failed: " + (err.reason || err.message));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Create New Token</h2>
                {error && (
                    <div className="mb-4 p-2 bg-red-600 text-white rounded">
                        {error}
                    </div>
                )}
                <div className="mb-4">
                    <label className="block mb-1 text-gray-300">Token Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="My Token"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 text-gray-300">Token Symbol</label>
                    <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="MTK"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 text-gray-300">Token Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                    />
                    {imagePreview && (
                        <div className="mt-2">
                            <img
                                src={imagePreview}
                                alt="Token Preview"
                                className="w-24 h-24 object-cover rounded-full"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-200"
                    >
                        Create (0.01 BNB)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTokenModal;