import React, { useState } from 'react';
import Web3 from 'web3';

const TokenModal = ({ web3, account, closeModal }) => {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // MyToken ABI와 바이트코드 (Hardhat에서 가져옴)
  const tokenABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_symbol",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "description",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  const tokenBytecode = '0x60806040526012600360006101000a81548160ff021916908360ff16021790555034801561002c57600080fd5b506040516116a03803806116a0833981810160405281019061004e9190610275565b826000908161005d919061053d565b50816001908161006d919061053d565b50806002908161007d919061053d565b50600360009054906101000a900460ff1660ff16600a61009d9190610771565b6305f5e1006100ac91906107bc565b600481905550600454600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505050506107fe565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101678261011e565b810181811067ffffffffffffffff821117156101865761018561012f565b5b80604052505050565b6000610199610100565b90506101a5828261015e565b919050565b600067ffffffffffffffff8211156101c5576101c461012f565b5b6101ce8261011e565b9050602081019050919050565b60005b838110156101f95780820151818401526020810190506101de565b60008484015250505050565b6000610218610213846101aa565b61018f565b90508281526020810184848401111561023457610233610119565b5b61023f8482856101db565b509392505050565b600082601f83011261025c5761025b610114565b5b815161026c848260208601610205565b91505092915050565b60008060006060848603121561028e5761028d61010a565b5b600084015167ffffffffffffffff8111156102ac576102ab61010f565b5b6102b886828701610247565b935050602084015167ffffffffffffffff8111156102d9576102d861010f565b5b6102e586828701610247565b925050604084015167ffffffffffffffff8111156103065761030561010f565b5b61031286828701610247565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061036e57607f821691505b60208210810361038157610380610327565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103e97fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826103ac565b6103f386836103ac565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061043a6104356104308461040b565b610415565b61040b565b9050919050565b6000819050919050565b6104548361041f565b61046861046082610441565b8484546103b9565b825550505050565b600090565b61047d610470565b61048881848461044b565b505050565b5b818110156104ac576104a1600082610475565b60018101905061048e565b5050565b601f8211156104f1576104c281610387565b6104cb8461039c565b810160208510156104da578190505b6104ee6104e68561039c565b83018261048d565b50505b505050565b600082821c905092915050565b6000610514600019846008026104f6565b1980831691505092915050565b600061052d8383610503565b9150826002028217905092915050565b6105468261031c565b67ffffffffffffffff81111561055f5761055e61012f565b5b6105698254610356565b6105748282856104b0565b600060209050601f8311600181146105a75760008415610595578287015190505b61059f8582610521565b865550610607565b601f1984166105b586610387565b60005b828110156105dd578489015182556001820191506020850194506020810190506105b8565b868310156105fa57848901516105f6601f891682610503565b8355505b6001600288020188555050505b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60008160011c9050919050565b6000808291508390505b6001851115610695578086048111156106715761067061060f565b5b60018516156106805780820291505b808102905061068e8561063e565b9450610655565b94509492505050565b6000826106ae576001905061076a565b816106bc576000905061076a565b81600181146106d257600281146106dc5761070b565b600191505061076a565b60ff8411156106ee576106ed61060f565b5b8360020a9150848211156107055761070461060f565b5b5061076a565b5060208310610133831016604e8410600b84101617156107405782820a90508381111561073b5761073a61060f565b5b61076a565b61074d848484600161064b565b925090508184048111156107645761076361060f565b5b81810290505b9392505050565b600061077c8261040b565b91506107878361040b565b92506107b47fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff848461069e565b905092915050565b60006107c78261040b565b91506107d28361040b565b92508282026107e08161040b565b915082820484148315176107f7576107f661060f565b5b5092915050565b610e938061080d6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c806370a082311161006657806370a082311461015d5780637284e4161461018d57806395d89b41146101ab578063a9059cbb146101c9578063dd62ed3e146101f95761009e565b806306fdde03146100a3578063095ea7b3146100c157806318160ddd146100f157806323b872dd1461010f578063313ce5671461013f575b600080fd5b6100ab610229565b6040516100b89190610a3c565b60405180910390f35b6100db60048036038101906100d69190610af7565b6102b7565b6040516100e89190610b52565b60405180910390f35b6100f96103a9565b6040516101069190610b7c565b60405180910390f35b61012960048036038101906101249190610b97565b6103af565b6040516101369190610b52565b60405180910390f35b6101476106a1565b6040516101549190610c06565b60405180910390f35b61017760048036038101906101729190610c21565b6106b4565b6040516101849190610b7c565b60405180910390f35b6101956106cc565b6040516101a29190610a3c565b60405180910390f35b6101b361075a565b6040516101c09190610a3c565b60405180910390f35b6101e360048036038101906101de9190610af7565b6107e8565b6040516101f09190610b52565b60405180910390f35b610213600480360381019061020e9190610c4e565b610987565b6040516102209190610b7c565b60405180910390f35b6000805461023690610cbd565b80601f016020809104026020016040519081016040528092919081815260200182805461026290610cbd565b80156102af5780601f10610284576101008083540402835291602001916102af565b820191906000526020600020905b81548152906001019060200180831161029257829003601f168201915b505050505081565b600081600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516103979190610b7c565b60405180910390a36001905092915050565b60045481565b600081600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610433576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161042a90610d3a565b60405180910390fd5b81600660008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410156104f2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104e990610da6565b60405180910390fd5b81600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546105419190610df5565b9250508190555081600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546105979190610e29565b9250508190555081600660008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461062a9190610df5565b925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161068e9190610b7c565b60405180910390a3600190509392505050565b600360009054906101000a900460ff1681565b60056020528060005260406000206000915090505481565b600280546106d990610cbd565b80601f016020809104026020016040519081016040528092919081815260200182805461070590610cbd565b80156107525780601f1061072757610100808354040283529160200191610752565b820191906000526020600020905b81548152906001019060200180831161073557829003601f168201915b505050505081565b6001805461076790610cbd565b80601f016020809104026020016040519081016040528092919081815260200182805461079390610cbd565b80156107e05780601f106107b5576101008083540402835291602001916107e0565b820191906000526020600020905b8154815290600101906020018083116107c357829003601f168201915b505050505081565b600081600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561086c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161086390610d3a565b60405180910390fd5b81600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546108bb9190610df5565b9250508190555081600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546109119190610e29565b925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516109759190610b7c565b60405180910390a36001905092915050565b6006602052816000526040600020602052806000526040600020600091509150505481565b600081519050919050565b600082825260208201905092915050565b60005b838110156109e65780820151818401526020810190506109cb565b60008484015250505050565b6000601f19601f8301169050919050565b6000610a0e826109ac565b610a1881856109b7565b9350610a288185602086016109c8565b610a31816109f2565b840191505092915050565b60006020820190508181036000830152610a568184610a03565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610a8e82610a63565b9050919050565b610a9e81610a83565b8114610aa957600080fd5b50565b600081359050610abb81610a95565b92915050565b6000819050919050565b610ad481610ac1565b8114610adf57600080fd5b50565b600081359050610af181610acb565b92915050565b60008060408385031215610b0e57610b0d610a5e565b5b6000610b1c85828601610aac565b9250506020610b2d85828601610ae2565b9150509250929050565b60008115159050919050565b610b4c81610b37565b82525050565b6000602082019050610b676000830184610b43565b92915050565b610b7681610ac1565b82525050565b6000602082019050610b916000830184610b6d565b92915050565b600080600060608486031215610bb057610baf610a5e565b5b6000610bbe86828701610aac565b9350506020610bcf86828701610aac565b9250506040610be086828701610ae2565b9150509250925092565b600060ff82169050919050565b610c0081610bea565b82525050565b6000602082019050610c1b6000830184610bf7565b92915050565b600060208284031215610c3757610c36610a5e565b5b6000610c4584828501610aac565b91505092915050565b60008060408385031215610c6557610c64610a5e565b5b6000610c7385828601610aac565b9250506020610c8485828601610aac565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610cd557607f821691505b602082108103610ce857610ce7610c8e565b5b50919050565b7f496e73756666696369656e742062616c616e6365000000000000000000000000600082015250565b6000610d246014836109b7565b9150610d2f82610cee565b602082019050919050565b60006020820190508181036000830152610d5381610d17565b9050919050565b7f496e73756666696369656e7420616c6c6f77616e636500000000000000000000600082015250565b6000610d906016836109b7565b9150610d9b82610d5a565b602082019050919050565b60006020820190508181036000830152610dbf81610d83565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610e0082610ac1565b9150610e0b83610ac1565b9250828203905081811115610e2357610e22610dc6565b5b92915050565b6000610e3482610ac1565b9150610e3f83610ac1565b9250828201905080821115610e5757610e56610dc6565b5b9291505056fea2646970667358221220414f46792980beb07aed0a18539b611c485fe1eacae6d41a2e76e5f706802eb264736f6c634300081c0033';

  
  const routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'; // PancakeSwap 테스트넷 Router
  const routerABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 새 토큰 배포
      const tokenContract = new web3.eth.Contract(tokenABI);
      const deployTx = tokenContract.deploy({
        data: tokenBytecode,
        arguments: [name, ticker, description],
      });
      const deployedToken = await deployTx.send({
        from: account,
        gas: 3000000,
      });
      const tokenAddress = deployedToken.options.address;
      console.log("New token deployed at:", tokenAddress);

      // 2. 백엔드에 토큰 정보 저장
      await fetch('http://localhost:5000/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: tokenAddress,
          name,
          ticker,
          creator: account,
        }),
      });

      // 3. 토큰 승인
      const tokenAmount = web3.utils.toWei('100000000', 'ether');
      await deployedToken.methods.approve(routerAddress, tokenAmount)
        .send({ from: account });

      // 4. 유동성 풀 추가
      const deadline = (Math.floor(Date.now() / 1000) + 60 * 10).toString();
      const routerContract = new web3.eth.Contract(routerABI, routerAddress);
      await routerContract.methods.addLiquidityETH(
        tokenAddress,
        tokenAmount,
        '0',
        '0',
        account,
        deadline
      ).send({
        from: account,
        value: web3.utils.toWei('0.05', 'ether'),
      });

      alert('토큰이 발행되고 유동성 풀이 추가되었습니다!\n토큰 주소: ' + tokenAddress);
      closeModal();
    } catch (error) {
      console.error(error);
      alert('작업 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <span onClick={closeModal} style={closeStyle}>×</span>
        <h2 style={titleStyle}>새 토큰 생성</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Ticker:
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
              disabled={loading}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
              style={textareaStyle}
            />
          </label>
          <label style={labelStyle}>
            Image Upload:
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              accept="image/*"
              required
              disabled={loading}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? '처리 중...' : 'Create Coin'}
          </button>
        </form>
      </div>
    </div>
  );
};

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', // 오버레이를 조금 더 어둡게
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)', // 그라데이션 배경
  padding: '30px',
  borderRadius: '15px',
  width: '400px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', // 그림자 효과
  position: 'relative',
  color: '#333', // 기본 텍스트 색상
};

const closeStyle = {
  position: 'absolute',
  top: '10px',
  right: '15px',
  fontSize: '24px',
  color: '#ff4d4d', // 닫기 버튼은 빨간색
  cursor: 'pointer',
};

const titleStyle = {
  color: '#0056b3', // 제목은 파란색
  textAlign: 'center',
  marginBottom: '20px',
  fontSize: '24px',
  fontWeight: 'bold',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const labelStyle = {
  color: '#0056b3', // 라벨은 파란색
  fontSize: '16px',
  fontWeight: '500',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  fontSize: '14px',
  backgroundColor: '#f9f9f9',
  transition: 'border-color 0.3s',
};

const textareaStyle = {
  width: '100%',
  height: '80px',
  padding: '10px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  fontSize: '14px',
  backgroundColor: '#f9f9f9',
  resize: 'none',
  transition: 'border-color 0.3s',
};

const buttonStyle = {
  padding: '12px',
  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', // 버튼 그라데이션
  color: '#ffffff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  transition: 'background 0.3s',
};

export default TokenModal;

// CSS 동적 스타일링 (포커스 효과 추가)
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  input:focus, textarea:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
  }
  button:hover:not(:disabled) {
    background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
  }
  button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;
document.head.appendChild(styleSheet);