pragma solidity >=0.4.22 <0.7.0;
import './ReputationToken.sol';
import './ModeratorToken.sol';
import './ProjectCreator.sol';
contract Moderator{ 
    ModeratorToken mod;
    ReputationToken rep;
    ProjectCreator project;
      struct Transaction{
        string purpose;
        uint value;
        string proofLink;
        address admin;
        uint index;
        bool verified;
        uint transactionIndex;
        bool initialised;
    }
    Transaction t;
    constructor(address _modToken, address _repToken, address payable _pCreator) public{
        
        mod = ModeratorToken(_modToken);
        rep = ReputationToken(_repToken);
        project = ProjectCreator(_pCreator);
        
    }
    // function generateRandomTransactionFromReturn() public{
    //   (string memory purpose, uint value, string memory proofLink,address admin,uint index,bool verified,uint transactionIndex) = project.requestedRandomTransactionFromMod();
    //   t = Transaction(purpose,value,proofLink,admin,index,verified,transactionIndex,true);
    // }
    
     function generateRandomTransactionFromEmit(string memory purpose, uint value, string memory proofLink,address admin,uint index,bool verified,uint transactionIndex) public{
        //Call this function after retrieveing it from the emit
       t = Transaction(purpose,value,proofLink,admin,index,verified,transactionIndex,true);
    }
    
    event transferReputation(address receiver, address moderator);
    event transferModeratorToken(address receiver);
    function validateTransaction() public{
        //TODO Should not be able to validate own transaction
        require(msg.sender != t.admin);
        require(t.initialised == true,"Not initialised yet!");
        //Replace with transaction index
        project.makeTransactionValid(t.admin,t.index,t.transactionIndex);
        //Increase mod tokens and increase reputation tokens for the owner of project
        rep.transferFrom(rep.returnOwner(),t.admin,1);
        mod.transferFrom(mod.returnOwner(),msg.sender,1);
        emit transferReputation(t.admin,msg.sender);
        emit transferModeratorToken(msg.sender);
    }
    
    function rejectTransaction() public{
        require(msg.sender != t.admin);
        require(t.initialised == true,"Not initialised yet!");
        mod.transferFrom(mod.returnOwner(),msg.sender,1);
        emit transferModeratorToken(msg.sender);
    }
    function viewModeratorTokenBalance()public view returns(uint){
        return mod.balanceOf(msg.sender);
    }
    
}