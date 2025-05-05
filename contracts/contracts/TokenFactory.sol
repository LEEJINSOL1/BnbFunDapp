// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address presaleAddr,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(presaleAddr) {
        _mint(presaleAddr, initialSupply);
    }
}contract TokenFactory is Ownable {
    uint256 public constant CREATE_FEE = 0.01 ether;
    address public immutable presaleContract;

event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 createdAt);
event Debug(string message, uint256 value);

constructor(address _presaleContract) Ownable(msg.sender) {
    presaleContract = _presaleContract;
}

function createToken(string memory name, string memory symbol) external payable {
    emit Debug("Step 1: Function entered, received value", msg.value);
    require(msg.value == CREATE_FEE, string(abi.encodePacked("Incorrect fee: expected ", CREATE_FEE, " but got ", msg.value)));
    emit Debug("Step 2: Fee checked", msg.value);
    require(bytes(name).length > 0, "Name cannot be empty");
    require(bytes(symbol).length > 0, "Symbol cannot be empty");
    emit Debug("Step 3: Input validated", 0);
    address newTokenAddr = address(new CustomToken(name, symbol, presaleContract, 100_000_000 * 10**18));
    emit Debug("Step 4: Token created", 0);
    emit TokenCreated(newTokenAddr, name, symbol, block.timestamp);
    emit Debug("Step 5: Token created, address", uint256(uint160(newTokenAddr)));
}

function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, "No funds to withdraw");
    (bool success, ) = owner().call{value: balance}("");
    require(success, "Withdrawal failed");
}
}