import React from "react";
import { Link } from "react-router-dom";

const TokenList = ({ tokens }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tokens.length === 0 ? (
        <p className="text-center col-span-3">No tokens created yet.</p>
      ) : (
        tokens.map((token, index) => (
          <Link to={`/presale/${token.tokenAddress}`} key={index}>
            <div className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700">
              <h3 className="text-lg font-bold">{token.name}</h3>
              <p>{token.symbol}</p>
              {token.image && (
                <img
                  src={URL.createObjectURL(token.image)}
                  alt={token.name}
                  className="w-16 h-16 mt-2 rounded-full"
                />
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default TokenList;