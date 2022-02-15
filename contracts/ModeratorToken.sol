pragma solidity >=0.4.22 <0.7.0;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
contract ModeratorToken is ERC20{
    address owner;
    constructor() ERC20("ModeratorToken","MOD") public {
        _mint(msg.sender, 10000 * 10 ** uint(decimals()));
        owner = msg.sender;
        
    }
        
    function approveContract(address recipient,uint value)external{
        approve(recipient,value);
    }
    function returnOwner() public view returns(address _owner){
        return owner;
    }
    

}