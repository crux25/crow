const ReputationToken = artifacts.require("ReputationToken");
const ModeratorToken = artifacts.require("ModeratorToken");
const ProjectCreator = artifacts.require("ProjectCreator");
const Moderator = artifacts.require("Moderator");
const Donor = artifacts.require("Donor");
module.exports = function(deployer) {
  deployer.then(async () => {
  
    const repTokenInst = await deployer.deploy(ReputationToken);
    console.log('ReputationToken contract deployed at', repTokenInst.address);

    const modTokenInst = await deployer.deploy(ModeratorToken);
    console.log('ModeratorToken contract deployed at', modTokenInst.address);

    const projInst = await deployer.deploy(ProjectCreator, repTokenInst.address);
    console.log('ProjCreator contract deployed at', projInst.address);

    const modInst = await deployer.deploy(Moderator, modTokenInst.address, repTokenInst.address, projInst.address);
    console.log('Moderator contract deployed at', modInst.address);

    await repTokenInst.approveContract(modInst.address,100000);
    await modTokenInst.approveContract(modInst.address,100000);

    const donorInst = await deployer.deploy(Donor, projInst.address);
    console.log('Donor contract deployed at', donorInst.address);
  })
};
