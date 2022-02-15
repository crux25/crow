pragma solidity ^0.6.6;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
contract ReputationToken is ERC20{
    address owner;
    constructor() ERC20("Reputation","RP") public {
        _mint(msg.sender, 100000 * 10 ** uint(decimals()));
        owner = msg.sender;
        
    }
    
    function approveContract(address recipient,uint value)external{
        approve(recipient,value);
    }
      function returnOwner() public view returns(address _owner){
        return owner;
    }

}