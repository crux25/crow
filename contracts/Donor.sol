pragma solidity >=0.4.22 <=0.7.0;
import './ReputationToken.sol';
import './ProjectCreator.sol';
contract Donor{
    
    address payable public donor;
    ProjectCreator p;
    address payable projectCreatorAdd;
    address public temp;
    constructor(address payable _pCreatorToken) public{
        projectCreatorAdd = _pCreatorToken;
        p = ProjectCreator(projectCreatorAdd);
        temp = projectCreatorAdd;
    }
    event DonatedMoney(address donor, uint amount,string message,address projectAdmin, uint index);
    function donate(uint donation, address admin, uint index,string memory message)public payable{
        donor = msg.sender;
        require(donor != admin, "Cannot donate to self");
        //Call function in ProjectCreator to update values
        if(p.checkLimit(donation,admin,index) == false){
            revert('Limt crossed/Invalid Amount');
            //Message saying not possible to donate since limit has been crossed/ Invalid amount
        }else{
            //projectCreatorAdd.transfer(donation);
            p.donatedAmount(donation,admin,index);
            //Emit event after this
            emit DonatedMoney(donor,donation,message,admin,index);
            //Access transaction using web3.js
            //Give a reward badge for donating money
        }
        
    }
    
}