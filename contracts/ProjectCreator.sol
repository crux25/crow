pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;
import './ReputationToken.sol';
contract ProjectCreator{
    struct Project{
        string name;
        string description;
        uint limit;
        address admin;
        uint donatedValue;
        uint balance;
        mapping ( uint=> Transaction) transactions;
        uint transactionSize;
        uint spentAmount;
        uint index;
    }
    struct Transaction{
        Project p;
        string purpose;
        uint value;
        string proofLink;
        address admin;
        uint index;
        bool verified;
        uint transactionIndex;
    }
    struct globalIndexToAdmin{
        address admin;
        uint adminIndex;
    }
    ReputationToken rep;
    Project p;
    uint public pCount;
    mapping (uint => globalIndexToAdmin) public projectMap;
    mapping (address => Project[]) public projects;
    mapping (address => uint) public projectCount;
    mapping(uint256 => Transaction) queue;
    uint256 first = 1;
    uint256 last = 0;
    mapping (address => bool) adminCheck;
    address[] public keyList;
    uint public adminCount = 0;
    mapping (address => uint) overallTransactionCount;

 
    constructor(address _repToken) public{
        rep = ReputationToken(_repToken);
    }
    function showBalance()public view returns(uint){
        return address(this).balance;
    }
    function showEtherBalance() public view returns(uint){
        return address(this).balance / (10**18);
    }
    receive() external payable{
        //Receive Ether
    }
    fallback() external{
        //In case of an error in receiving ether
    }
    function createProject(string memory _name, string memory _desc, uint _value) public{
        //Ratio between transactionCount count and reputation matters here
        //If ratio is too low, no project creation
        uint transactionCount = overallTransactionCount[msg.sender];
        uint repTokensBalance = rep.balanceOf(msg.sender);
        if(repTokensBalance == 0){
           repTokensBalance = 1;
        }
        uint ratio = transactionCount/repTokensBalance;
        require(ratio <=2,"Reputation too low to create a project!");
        p = Project({name: _name, description: _desc, limit: _value,admin: msg.sender,donatedValue: 0, balance: _value,transactionSize: 0,spentAmount:0,index: projectCount[msg.sender]});
        projects[msg.sender].push(p);
        projectMap[pCount] = globalIndexToAdmin({admin: msg.sender, adminIndex: projectCount[msg.sender] });
        //Remove Duplicates
        if(adminCheck[msg.sender] == false){
            adminCheck[msg.sender] = true;
            keyList.push(msg.sender);
            adminCount ++;
        }
        projectCount[msg.sender]++;
        pCount++;
    }
    
    event ViewProject(string  name, string  desc,uint value,address admin);
    function viewProject(address owner,uint index) public returns(string memory name, string memory desc,uint value,address admin, uint donatedValue, uint balance, uint transactionSize, uint spentAmount, uint index1){
        Project memory pr = projects[owner][index];
        emit ViewProject(pr.name,pr.description,pr.limit,pr.admin);
        return (pr.name,pr.description,pr.limit,pr.admin, pr.donatedValue, pr.balance, pr.transactionSize, pr.spentAmount, pr.index );
    }
    function returnProjectCountForCreator(address admin)external view returns (uint count){
        return projectCount[admin];
    }
    event ViewAllProjects(string[]  names, string[]  desc, uint[]  limits,address[]  owners);
    function viewProjects(address admin) public returns (string[] memory names, string[] memory desc, uint[] memory limits,address[] memory owners){
        uint length = projects[admin].length;
        string[] memory n = new string[](length);
        string[] memory d = new string[](length);
        uint[] memory l = new uint[](length);
        address[] memory o = new address[](length);
        for (uint i=0;i<length;i++){
            n[i] =  projects[admin][i].name;
            d[i] =  projects[admin][i].description;
            l[i] =  projects[admin][i].limit;
            o[i] =  projects[admin][i].admin;
        }
        emit ViewAllProjects(n,d,l,o);
        return (n,d,l,o);
    }
    function viewAllProjectAdmins() public view returns(address[] memory arrayOfProjectOwners){
        return keyList;
        //Use this list to retreive all the owners and based on that, use the view projects function. 
    }
    
    function submitProof(string memory link, address admin, uint index, uint transactionIndex) public{
        require(admin == msg.sender,"Invalid User");
        projects[admin][index].transactions[transactionIndex].proofLink = link;
        enqueue(projects[admin][index].transactions[transactionIndex]);
    }
    event generateRandomTransaction(string  purpose,uint value, string  proofLink,address admin,uint index,bool verified,uint transactionIndex);
    function requestedRandomTransactionFromMod()public returns( string memory purpose,uint value, string memory proofLink,address admin,uint index,bool verified,uint transactionIndex){
        Transaction memory review = dequeue();
        //Process the emit here and pass it on the moderator function
        emit generateRandomTransaction(review.purpose,review.value,review.proofLink,review.admin,review.index,review.verified,review.transactionIndex);
        return (review.purpose,review.value,review.proofLink,review.admin,review.index,review.verified,review.transactionIndex);
    }
  
    function enqueue(Transaction memory data) internal {
        last += 1;
        queue[last] = data;
    }
    
    function dequeue() internal returns (Transaction memory data) {
        require(last >= first,'Err');  // non-empty queue
        data = queue[first];
        delete queue[first];
        first += 1;
    }
    
    function withdraw(uint amount, uint index,string memory purpose) public{
        //Withdraw based on reputation
        //Based on Ratio of transactionCount and reputation.
        //Require statement not needed because i am using msg.sender
        uint transactionCount = projects[msg.sender][index].transactionSize;
        uint repTokensBalance = rep.balanceOf(msg.sender);
        if(repTokensBalance == 0){
           repTokensBalance = 1;
        }
        uint ratio = transactionCount/repTokensBalance;
        require(ratio<=2,"Reputation Balance Low!");
        uint remainingValue = projects[msg.sender][index].donatedValue - projects[msg.sender][index].spentAmount;
        uint amtInEther = amount / (10**18);
        require(remainingValue > amtInEther,"Invalid Withdrawal Amount");
        msg.sender.transfer(amount);
        amount = amount / (10**18);
        //Add transaction details
        uint transactionSize = projects[msg.sender][index].transactionSize;
        Transaction memory t = Transaction(projects[msg.sender][index],purpose,amount,"",msg.sender,index,false,transactionSize);
        projects[msg.sender][index].transactions[transactionSize] = t;
        projects[msg.sender][index].transactionSize++;
        overallTransactionCount[msg.sender]++;
        projects[msg.sender][index].spentAmount = projects[msg.sender][index].spentAmount + amount;
    }
    function checkLimit(uint donatedAmt, address admin, uint index) public view returns (bool isLimitReached){
        uint currentDonated = projects[admin][index].donatedValue;
        uint limit = projects[admin][index].limit;
        if(currentDonated+ donatedAmt < limit){
            return true;
        }else{
            return false;
        }
        
    }
    function viewReputationTokenBalance() public view returns(uint){
        return rep.balanceOf(msg.sender);
    }
    function donatedAmount(uint donatedAmt, address admin, uint index) public {
        projects[admin][index].donatedValue = projects[admin][index].donatedValue + donatedAmt;
        projects[admin][index].balance = projects[admin][index].limit - projects[admin][index].donatedValue;
    }
    
    function viewDonatedAmount(address admin, uint index)public view returns(uint value){
        return projects[admin][index].donatedValue;
    }
    function viewSpentAmount(address admin, uint index)public view returns(uint value){
        return projects[admin][index].spentAmount;
    }
    function makeTransactionValid(address admin, uint index, uint transactionIndex)public{
        projects[admin][index].transactions[transactionIndex].verified = true;
    }
    event ViewAllTransactions(string[]  _purpose, uint[]  _value,string[]  _proofLink,address _admin,bool[] _verified, uint[]  _transactionIndex);
    function viewAllTransactionsForProject(address admin, uint index)public{
        uint length = projects[admin][index].transactionSize;
        string[] memory purpose = new string[](length);
        uint[] memory value = new uint[](length);
        string[] memory proofLink = new string[](length);
        bool[] memory verified = new bool[](length);
        uint[]  memory transactionIndex = new uint[](length);
        for(uint i=0;i<length;i++){
            purpose[i] = projects[admin][index].transactions[i].purpose;
            value[i] = projects[admin][index].transactions[i].value;
            proofLink[i] = projects[admin][index].transactions[i].proofLink;
            verified[i] = projects[admin][index].transactions[i].verified;
            transactionIndex[i] = projects[admin][index].transactions[i].transactionIndex;
        }
        emit ViewAllTransactions(purpose,value,proofLink,admin,verified,transactionIndex);
    }
    function viewSingleTransaction(address admin, uint index, uint tindex) public view returns (string memory purpose,uint value, string memory proofLink,bool verified) {
        Transaction memory temp = projects[admin][index].transactions[tindex];
        return(temp.purpose,temp.value, temp.proofLink,temp.verified);
    }
}