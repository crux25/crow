const ProjectCreator = artifacts.require('ProjectCreator');
const truffleAssert = require("truffle-assertions");
const Donor = artifacts.require('Donor');
const Moderator = artifacts.require('Moderator');
contract('ProjectCreator',async accounts=>{
    let projectCreator = null;
    let creator = null;
    let acc2 = null;
    let donor = null;
    let moderator = null;
    before(async()=>{
        projectCreator = await ProjectCreator.deployed();
        donor = await Donor.deployed();
        moderator = await Moderator.deployed();
        creator = accounts[1];
        acc2 = accounts[2];
    });
    //Create Project And View Project
    it('Create and View a Project',async()=>{
        let tx = await projectCreator.createProject("Project1","Description",100,{from: creator});
        const val = await projectCreator.viewProject.call(creator,0,{from: creator});
        assert(val[3] === creator);
        assert(val[2].toNumber() === 100);
        assert(val[0] === "Project1" );
        assert(val[1] === "Description");
    });

    //Donating to a project
    it('Donating to a project',async()=>{
        let one_eth = web3.utils.toWei('10', "ether");
        await web3.eth.sendTransaction({from: acc2, to: projectCreator.address, value: one_eth});
        let donationTx = await donor.donate(10,creator,0,"Donation From Account 2",{from: acc2});
        const donatedVal = await projectCreator.viewDonatedAmount.call(creator,0,{from: creator});
        assert(donatedVal.toNumber() === 10);
        truffleAssert.eventEmitted(donationTx, 'DonatedMoney', (ev) => {
            return ev.donor === acc2 && ev.amount.toNumber() === 10 && ev.projectAdmin === creator && ev.index.toNumber() == 0;
        });
    });

    //Invalid donation test case
    it('Invalid Donation Test Case',async()=>{
        //Donate 95 more
        try{
        let donationTx = await donor.donate(95,creator,0,"2nd Donation From Account 2",{from: acc2});
        }catch(e){
            assert(e.message.includes('Limt crossed/Invalid Amount'));
            return;
        }
        assert(false);
    });

    //Withdraw Test case
    it('Withdrawing Test Case',async()=>{
        let five_eth = web3.utils.toWei('5','ether');
        let one_eth = web3.utils.toWei('1','ether');
        let withdrawTx = await projectCreator.withdraw(five_eth,0,"Transaction 1",{from: creator});

        const spentAmount = await projectCreator.viewSpentAmount.call(creator,0,{from: creator});
        assert(spentAmount.toNumber() === 5);
        const contractBalance = await projectCreator.showEtherBalance.call();
        assert(contractBalance.toNumber() === 5);
        let withdrawTx2 = await projectCreator.withdraw(one_eth,0,"Transaction 2",{from: creator});
    });

    //Submit proof test
    it('Submitting Proof Test',async()=>{
        const submitProofTx = await projectCreator.submitProof("Website Link",creator,0,0,{from: creator});
        const viewSingleTx = await projectCreator.viewSingleTransaction.call(creator,0,0,{from: creator});
        assert(viewSingleTx[0] === "Transaction 1" );
        assert(viewSingleTx[1].toNumber() === 5);
        assert(viewSingleTx[2] === "Website Link");
        assert(viewSingleTx[3] === false); 
        const submitProofTx2 = await projectCreator.submitProof("Website Link 2",creator,0,1,{from: creator});
    });

    //Generating transaction for Moderator
    it('Getting a transaction for a Moderator',async()=>{
        let generateRandomTx = await projectCreator.requestedRandomTransactionFromMod({from: acc2});
        //console.log(generateRandomTx);
        let purpose;
        let value;
        let proofLink;
        let admin;
        let index;
        let verified;
        let txIndex;
        truffleAssert.eventEmitted(generateRandomTx, 'generateRandomTransaction', (ev) => {
            purpose = ev.purpose;
            value = ev.value.toNumber();
            proofLink = ev.proofLink;
            admin = ev.admin;
            index = ev.index.toNumber();
            verified = ev.index.verified;
            txIndex = ev.transactionIndex.toNumber();
            return ev.admin === creator && ev.transactionIndex.toNumber() === 0 && ev.index.toNumber() === 0;
        });
        const callModFunction = await moderator.generateRandomTransactionFromEmit(purpose,value,proofLink,admin,index,verified,txIndex);
        
    });

    //Validating a transaction
    it('Validating a Transaction in Moderator',async()=>{
        
        let validateTx = await moderator.validateTransaction({from: acc2});
        truffleAssert.eventEmitted(validateTx,'transferReputation',(ev)=>{
            return ev.receiver == creator && ev.moderator == acc2;
        });
        truffleAssert.eventEmitted(validateTx,'transferModeratorToken',(ev) =>{
            return ev.receiver == acc2;
        });
        //Check if validation successful
        let successCheck = await projectCreator.viewSingleTransaction.call(creator,0,0);
        assert(successCheck.verified === true);
        //Check reputation and moderator Balance
        let repBalance = await projectCreator.viewReputationTokenBalance.call({from: creator});
        assert(repBalance.toNumber() === 1);
        //console.log(repBalance);
        let modBalance = await moderator.viewModeratorTokenBalance.call({from: acc2});
        //console.log(modBalance)
        assert(modBalance.toNumber() === 1);
    });

    //Reject a transaction
    it('Rejecting a Transaction in Moderator',async()=>{
        let generateRandomTx = await projectCreator.requestedRandomTransactionFromMod({from: acc2});
        //console.log(generateRandomTx);
        let purpose;
        let value;
        let proofLink;
        let admin;
        let index;
        let verified;
        let txIndex;
        truffleAssert.eventEmitted(generateRandomTx, 'generateRandomTransaction', (ev) => {
            purpose = ev.purpose;
            value = ev.value.toNumber();
            proofLink = ev.proofLink;
            admin = ev.admin;
            index = ev.index.toNumber();
            verified = ev.index.verified;
            txIndex = ev.transactionIndex.toNumber();
            return ev.admin === creator && ev.transactionIndex.toNumber() === 1 && ev.index.toNumber() === 0;
        });
        const callModFunction = await moderator.generateRandomTransactionFromEmit(purpose,value,proofLink,admin,index,verified,txIndex);

        let rejectTx = await moderator.rejectTransaction({from: acc2});
        truffleAssert.eventEmitted(rejectTx,'transferModeratorToken',(ev) =>{
            return ev.receiver == acc2;
        });
        let successCheck = await projectCreator.viewSingleTransaction.call(creator,0,1);
        assert(successCheck.verified === false);
        let modBalance = await moderator.viewModeratorTokenBalance.call({from: acc2});
        //console.log(modBalance)
        assert(modBalance.toNumber() === 2);
    });
});