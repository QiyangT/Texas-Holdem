pragma solidity ^0.5.0;

// import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ExchangeCurrency{
	struct Account {
		uint tokens;
		bool isInGame;
		bool isValid;
	}
	
	event test (
		address payable owner1,
		address owner2,
		bool val
	);
	
	event Transfer (
		address indexed from, 
		address indexed to, 
		uint256 value
	);
	
	uint public ethToToken; 
	mapping(address => Account) public accounts;
	
	constructor() public {
		ethToToken = 1000;
	}
	
	function buyTokens(uint nTokens) public payable {
		require(accounts[msg.sender].isInGame == false, "1");
		require(1 ether * nTokens / ethToToken == msg.value, "2");
		if(accounts[msg.sender].isValid == true)
			accounts[msg.sender].tokens += nTokens;
		else
			accounts[msg.sender] = Account(nTokens, false, true);
		emit Transfer(msg.sender, address(this), nTokens);
	}
	
	function sellTokens(uint nTokens) public payable {
		require(accounts[msg.sender].isValid == true, "1");
		require(accounts[msg.sender].isInGame == false, "2");
		require(accounts[msg.sender].tokens >= nTokens, "3");
		accounts[msg.sender].tokens -= nTokens;
		msg.sender.transfer(1 ether * nTokens / ethToToken);
		emit Transfer(address(this), msg.sender, nTokens);
	}
	
	function checkExchangeRate() public view returns(uint) {
		return ethToToken;
	}
	
	function tokenBalance() public view returns(uint) {
		return accounts[msg.sender].tokens;
	}
}