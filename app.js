
App = {
  loading: false,
  contracts: {},
  mainState: 0,
  globalIndex: 0,
  globalAdmin: 0,
  adminIndex: 0,
  
  
  //0=main, 1=procCreate, 2=Mod, 3=Donor
    // main 3 choice                       1


    // loading: false,					          101
    // createProjectState: false,				  102
    // viewMyProjectsState: false,			  103
    // viewAllProjectsState: false,				104
    // viewAllAdmins: false,				      105
    // withdrawFromProjectState: false,		106
    // viewAllTransactionState: false,		107
    // submitProofState: false,				    108
    // viewReputationState: false,				109
    // homeState: false,					        110

    // validateTransaction                201
    //          Accept/Reject a transaction
    //          Goto ProjCreate and get transaction and feed it to a func
    //          all other func ... figure it out
    // viewModeratorToken                 202
    // modHomePage                        203

    // donorViewAllProjects               301 == reuse 104
    // donateToProject                    302
    // viewAllTransaction                 303 == reuse 107
    // viewAllAdmin                       304 == reuse 105
    // donorHomePage                      305


  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    
    if (typeof web3 !== 'undefined') {
      const provider = await detectEthereumProvider();
      // var version = web3.version.api;
      App.web3Provider = provider

      console.log("Metamask is Installed!!")
      //web3 = new Web3(web3.currentProvider)
    } else {
      window.alert('Please connect to Metamask.')
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      //window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        const accAccess = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Acccounts now exposed
        //:TODO

        // try {
        // const transactionHash = await ethereum.request({
        //   method: 'eth_sendTransaction',
        //   params: [
        //     {
        //       to: null,
        //       'from': null,
        //       value: null,
        //       // And so on...
        //     },
        //   ],
        // });
        //   // Handle the result
        //   console.log(transactionHash);
        // } catch (error) {
        //   console.error(error);
        // }
        // web3.eth.sendTransaction({
        //   /* ... */
        // })
      } catch (error) {
        // User denied account access...
        if(error.code === 4001){
          console.log("Denied");
        }
        
      }
    }
    // // Legacy dapp browsers...
    // else if (window.web3) {
    //   App.web3Provider = web3.currentProvider
    //   window.web3 = new Web3(web3.currentProvider)
    //   // Acccounts always exposed
    //   // web3.eth.sendTransaction({
    //   //   /* ... */
    //   // })
    // }
    // Non-dapp browsers...
    else {
      console.log(
        'Non-Ethereum browser detected. You should consider trying MetaMask!',
      )
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    const accounts = await ethereum.request({method: 'eth_accounts'});
    App.account = accounts[0];
  },
  loadContract: async () => {
    
    // Create a JavaScript version of the smart contract
    const PC = await $.getJSON('ProjectCreator.json')
    const PCData = PC.networks['5777']

    // if(PCData){
    //   const tok = new web3.eth.Contract(PC.abi,PCData.address)
    // }
    console.log(PCData);
    // //App.contracts.PC = contract(PC)
    // The minimum ABI to get ERC20 Token balance
    App.contracts.PC = TruffleContract(PC)
    App.contracts.PC.setProvider(App.web3Provider)

    const M = await $.getJSON('Moderator.json')
    App.contracts.M = TruffleContract(M)
    App.contracts.M.setProvider(App.web3Provider)

    const D = await $.getJSON('Donor.json')
    App.contracts.D = TruffleContract(D)
    App.contracts.D.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.PC = await App.contracts.PC.deployed()
    App.M = await App.contracts.M.deployed()
    App.D = await App.contracts.D.deployed()

  },


  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(1)

    // Render Account
    console.log(App.account)


    //Render All ProjectCreator
    await App.renderMyProjects()
    await App.renderAllProjects()
    await App.renderAllAdmins()
    await App.renderReputationBalance()

    //Render All Moderator
    await App.renderModTokenBalance()

    //Render All Donor
    await App.renderAllProjectsDonor()
    await App.renderAllAdminsDonor()

    // Update loading state
    if(App.mainState === 0){
      App.setLoading(1)
    }
    else if(App.mainState === 1){
      App.setLoading(110)
    }
    else if(App.mainState === 2){
      App.setLoading(203)
    }
    else if(App.mainState === 3){
      App.setLoading(305)
    }
  },











// MAIN PAGE FUNCTIONS
SET_MAIN_PAGE: async () => {
  
  App.mainState = 0
  App.setLoading(1)
  //window.location.reload()
},
SET_PROJECT_CREATOR: async () => {

  App.mainState = 1
  App.setLoading(110)
  //window.location.reload()
},
SET_MODERATOR: async () => {

  App.mainState = 2
  App.setLoading(203)
},
SET_DONOR: async () => {

  App.mainState = 3
  App.setLoading(305)
},
// END OF MAIN PAGE FUNCTIONS
















// PROJECT CREATOR FUNCTIONS

  renderAllProjects: async () => {
    // Load the total task count from the blockchain
    const PCCount = await App.PC.pCount()
    const $allProjectsTemplate = $('.allProjectsTemplate')

    // Render out each task with a new task template
    for (var i = 0; i < PCCount; i++) {
      // Fetch the task data from the blockchain
      const indexMap = await App.PC.projectMap(i)
      const projAdmin = indexMap[0]
      const projAdminIndex = indexMap[1].toNumber()
      const proj = await App.PC.viewProject.call(projAdmin,projAdminIndex)
      const name = proj[0]
      const desc = proj[1]
      const limit = proj[2].toNumber()
      const admin = proj[3]
      const donatedVal = proj[4].toNumber()
      const bal = proj[5].toNumber()

      // Create the html for the task
      const $newAllProjectsTemplate = $allProjectsTemplate.clone()
      $newAllProjectsTemplate.find('.pID').html(i)
      $newAllProjectsTemplate.find('.pName').html(name)
      $newAllProjectsTemplate.find('.pDesc').html(desc)
      $newAllProjectsTemplate.find('.pLimit').html(limit)
      $newAllProjectsTemplate.find('.pAdmin').html(admin)

      $('#allProjects').append($newAllProjectsTemplate)

      $newAllProjectsTemplate.show()
    }
  },

  renderMyProjects: async () => {
    // Load the total task count from the blockchain
    const PCCount = await App.PC.pCount()
    const $myProjectsTemplate = $('.myProjectsTemplate')
    const pCountNo = PCCount.toNumber()
    // Render out each task with a new task template
    for (var i = 0; i < pCountNo; i++) {
      // Fetch the task data from the blockchain
      const indexMap = await App.PC.projectMap(i)

      const projAdmin = indexMap[0]
      const projAdminIndex = indexMap[1].toNumber()
      const proj = await App.PC.viewProject.call(projAdmin,projAdminIndex)
      const name = proj[0]
      const desc = proj[1]
      const limit = proj[2].toNumber()
      const admin = proj[3]
      const donatedVal = proj[4].toNumber()
      const bal = proj[5].toNumber()
      const NOT = proj[6].toNumber()
      const spent = proj[7].toNumber()
      const adminIndex = proj[8].toNumber()
      if (admin.toLowerCase() === App.account.toLowerCase()) {
        // Create the html for the task
        const $newMyProjectsTemplate = $myProjectsTemplate.clone()
        $newMyProjectsTemplate.find('.pID').html(i)
        $newMyProjectsTemplate.find('.pName').html(name)
        $newMyProjectsTemplate.find('.pDesc').html(desc)
        $newMyProjectsTemplate.find('.pLimit').html(limit)
        $newMyProjectsTemplate.find('.pAdmin').html(admin)
        $newMyProjectsTemplate.find('.pDonatedVal').html(donatedVal)
        $newMyProjectsTemplate.find('.pBal').html(bal)
        $newMyProjectsTemplate.find('.pNOT').html(NOT)
        $newMyProjectsTemplate.find('.pSpent').html(spent)
        $newMyProjectsTemplate.find('.pAdminIndex').html(adminIndex)

        $('#myProjects').append($newMyProjectsTemplate)

        $newMyProjectsTemplate.show()
      }
    }
  },
  renderAllAdmins: async () => {
    // Load the total task count from the blockchain
    const AdminCount = await App.PC.adminCount()
    const $allAdminsTemplate = $('.allAdminsTemplate')

    for (var i = 0; i < AdminCount; i++) {
      // Fetch the task data from the blockchain
      const admin = await App.PC.keyList(i)
      const $newAllAdminsTemplate = $allAdminsTemplate.clone()
      $newAllAdminsTemplate.find('.adminAddr').html(admin)

      $('#allAdmins').append($newAllAdminsTemplate)

      $newAllAdminsTemplate.show()
    }
  },

  createProject: async () => {
    App.setLoading(110)
    const name = $('#name').val()
    const desc = $('#desc').val()
    const limit = $('#limit').val()
    await App.PC.createProject(name, desc, limit,{from: App.account})
    window.location.reload()
  },

  withdrawFromProject: async () => {
    const globalIndex = $('#projID').val()
    const amount1 = $('#amount').val()
    // const amount = amount1 * ((10)**18)
    const amount = amount1 
    const reason = $('#Reason').val()
    const indexMap = await App.PC.projectMap(globalIndex)
    const projAdmin = indexMap[0]
    const projAdminIndex = indexMap[1].toNumber()
    const proj = await App.PC.viewProject.call(projAdmin,projAdminIndex)
    await App.PC.withdraw(amount, projAdminIndex,reason,{from: App.account})
    const balanceNow = await App.PC.showEtherBalance.call()
  },

  renderReputationBalance: async () => {
    const bal1 = await App.PC.viewReputationTokenBalance.call()
    console.log('------ Reputation Token Begins here -------')
    // console.log("JS Call "+ balanceTest);
    console.log("Before To Number "+ bal1);
    // const bal = bal1.toNumber();
    const bal = 1;
    console.log("After To Number " + bal);
    const $reputationTemplate = $('.reputationTemplate')
    const $newReputationTemplate = $reputationTemplate.clone()
    $newReputationTemplate.find('.repBal').html(bal)
    $('#reputation').append($newReputationTemplate)
    $newReputationTemplate.show()
  },

  transactionsOfProject: async () => {
    const globalIndex = $('#projID1').val()
    const indexMap = await App.PC.projectMap(globalIndex)
    
    const projAdmin = indexMap[0]
    const projAdminIndex = indexMap[1].toNumber()

    const proj = await App.PC.viewProject.call(projAdmin,projAdminIndex)

    const $viewAllTransactionsTemplate = $('.viewAllTransactionsTemplate')
    const tsize = proj[6].toNumber()
    for (var i = 0; i < tsize; i++) {
      
      const transaction = await App.PC.viewSingleTransaction.call(projAdmin,projAdminIndex,i)

      const purpose = transaction[0]
      const value = transaction[1].toNumber()
      const proofLink = transaction[2]
      const verified = transaction[3]
      

      // Create the html for the task
      
      const $newViewAllTransactionsTemplate = $viewAllTransactionsTemplate.clone()
      $newViewAllTransactionsTemplate.find('.globalIndexTransaction').html(globalIndex)
      $newViewAllTransactionsTemplate.find('.adminTransaction').html(projAdmin)
      $newViewAllTransactionsTemplate.find('.adminProjIndexTransaction').html(projAdminIndex)
      $newViewAllTransactionsTemplate.find('.TransactionIndex').html(i)
      $newViewAllTransactionsTemplate.find('.purposeTransaction').html(purpose)
      $newViewAllTransactionsTemplate.find('.valueTransaction').html(value)
      $newViewAllTransactionsTemplate.find('.linkTransaction').html(proofLink)
      $newViewAllTransactionsTemplate.find('.verifiedTransaction').html(verified)

      $('#allTransactions').append($newViewAllTransactionsTemplate)

      $newViewAllTransactionsTemplate.show()
    }
  },

  submitProof: async () => {
    const globalIndex = $('#globalIndex').val()
    const tindex = $('#TransactionIndex').val()
    const link = $('#link').val()

    const indexMap = await App.PC.projectMap(globalIndex)
    const projAdmin = indexMap[0]
    const projAdminIndex = indexMap[1].toNumber()

    await App.PC.submitProof(link,projAdmin,projAdminIndex,tindex,{from: App.account})
  },
// TRANSFERRING FUNCTIONS
  goToCreate: async () => {

    App.setLoading(102)
  },

  goToViewMyProjects: async () => {
 
    App.setLoading(103)
  },

  goToViewAllProjects: async () => {

    App.setLoading(104)
  },

  goToViewAllAdmins: async () => {
 
    App.setLoading(105)
  },

  goToWithdraw: async () => {

    App.setLoading(106)
  },

  goToViewTransactions: async () => {
    App.setLoading(107)
  },

  goToSubmitProof: async () => {
   
    App.setLoading(108)
  },

  goToViewRepTokens: async () => {
    
    App.setLoading(109)
  },

  goToHome: async () => {

    App.setLoading(110)
  },
  // END OF PROJECT CREATOR FUNCTIONS















  // MODERATOR FUNCTIONS
  renderModTokenBalance: async () => {
    const $viewModTokenBalance = $('#viewModTokenHTML');
    const value = await App.M.viewModeratorTokenBalance.call();
    console.log('------ Moderator Token Begins here -------')
    console.log('Before To Number ' + value);
    console.log('After To Number '+ value.toNumber());
    // $('#balanceMod').html(value.toNumber());
    $('#balanceMod').html(1);
    
  },

  
  genRandomTransactionMod: async () => {
    const randT = await App.PC.requestedRandomTransactionFromMod.call()
    const purposeTransaction = randT[0]
    const valueTransaction = randT[1].toNumber()
    const proofLinkTransaction = randT[2]
    const adminTransaction = randT[3]
    const indexTransaction = randT[4].toNumber()
    const verifiedTransaction = randT[5]
    const tindexTransaction = randT[6].toNumber()

    const $validateTransactionTemplate = $('.validateTransactionTemplate')

    // Create the html for the task
      
    const $newValidateTransactionTemplate = $validateTransactionTemplate.clone()
    $newValidateTransactionTemplate.find('.purposeTransactionValidate').html(purposeTransaction)
    $newValidateTransactionTemplate.find('.valueTransactionValidate').html(valueTransaction)
    $newValidateTransactionTemplate.find('.proofLinkTransactionValidate').html(proofLinkTransaction)
    $newValidateTransactionTemplate.find('.adminTransactionValidate').html(adminTransaction)
    $newValidateTransactionTemplate.find('.projIndexTransactionValidate').html(indexTransaction)
    $newValidateTransactionTemplate.find('.transactionIndexTransactionValidate').html(tindexTransaction)

    $('#validateTransaction').append($newValidateTransactionTemplate)

    $newValidateTransactionTemplate.show()
    await App.M.generateRandomTransactionFromEmit(purposeTransaction, valueTransaction, proofLinkTransaction, adminTransaction, indexTransaction,verifiedTransaction,tindexTransaction,{from: App.account})
  },

  modValidateTransaction: async () => {
    const answer = $('#answerMod').val()

    console.log(answer)
    if(answer == 1){
      await App.M.validateTransaction({from: App.account})
      console.log("Valitdated Transaction")
    }
    else if(answer == 0){
      await App.M.rejectTransaction({from:App.account})
      console.log("Rejected Transaction")
    }
  },
  //Transfer Functions
  goToModHome: async () => {

    App.setLoading(203)
  },

  goToValidateTransaction: async () => {

    App.setLoading(201)
  },

  goToViewModTokens: async () => {

    App.setLoading(202)
  },
  // END OF MOD FUNCS














  // DONOR FUNCS
  renderAllProjectsDonor: async () => {
    // Load the total task count from the blockchain
    const PCCount = await App.PC.pCount()
    const $allProjectsDonorTemplate = $('.allProjectsDonorTemplate')

    // Render out each task with a new task template
    for (var i = 0; i < PCCount; i++) {
      // Fetch the task data from the blockchain
      const indexMap = await App.PC.projectMap(i)
  
      const projAdmin = indexMap[0]
      const projAdminIndex = indexMap[1].toNumber()

      const proj = await App.PC.viewProject.call(projAdmin,projAdminIndex)

      const name = proj[0]
      const desc = proj[1]
      const limit = proj[2].toNumber()
      const admin = proj[3]
      const donatedVal = proj[4].toNumber()
      const bal = proj[5].toNumber()
      const NOT = proj[6].toNumber()
      const spent = proj[7].toNumber()
      const adminIndex = proj[8].toNumber()

      // Create the html for the task
      const $newAllProjectsDonorTemplate = $allProjectsDonorTemplate.clone()
      $newAllProjectsDonorTemplate.find('.pID').html(i)
      $newAllProjectsDonorTemplate.find('.pName').html(name)
      $newAllProjectsDonorTemplate.find('.pDesc').html(desc)
      $newAllProjectsDonorTemplate.find('.pLimit').html(limit)
      $newAllProjectsDonorTemplate.find('.pAdmin').html(admin)
      $newAllProjectsDonorTemplate.find('.pDonatedVal').html(donatedVal)
      $newAllProjectsDonorTemplate.find('.pBal').html(bal)
      $newAllProjectsDonorTemplate.find('.pNOT').html(NOT)
      $newAllProjectsDonorTemplate.find('.pSpent').html(spent)
      $newAllProjectsDonorTemplate.find('.pAdminIndex').html(adminIndex)

      $('#allProjectsDonor').append($newAllProjectsDonorTemplate)

      $newAllProjectsDonorTemplate.show()
    }
  },

  renderAllAdminsDonor: async () => {
    // Load the total task count from the blockchain
    const AdminCount = await App.PC.adminCount()
    const $allAdminsDonorTemplate = $('.allAdminsDonorTemplate')

    for (var i = 0; i < AdminCount; i++) {
      // Fetch the task data from the blockchain
      const admin = await App.PC.keyList(i)
      const $newAllAdminsDonorTemplate = $allAdminsDonorTemplate.clone()
      $newAllAdminsDonorTemplate.find('.adminAddr').html(admin)

      $('#allAdminsDonor').append($newAllAdminsDonorTemplate)

      $newAllAdminsDonorTemplate.show()
    }
  },

  donateToProject: async () => {
    const mainIndex = $('#mainIndex').val()
    const amount = $('#value').val()
    const indexMap = await App.PC.projectMap(mainIndex)

    const admin = indexMap[0]
    const adminIndex = indexMap[1].toNumber()
    const msg ="hi"

    await App.D.donate(amount,admin,adminIndex,"Hi",{from: App.account})
    function dec2hex(str){ // .toString(16) only works up to 2^53
    var dec = str.toString().split(''), sum = [], hex = [], i, s
    while(dec.length){
        s = 1 * dec.shift()
        for(i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10
            sum[i] = s % 16
            s = (s - sum[i]) / 16
        }
    }
    while(sum.length){
        hex.push(sum.pop().toString(16))
    }
    return hex.join('')
}
    try {
      const transactionHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: App.account,
            to: App.PC.address,
            value: dec2hex((amount * ((10)**18)).toString())
          },
        ],
      });
      // Handle the result
    } catch (error) {
      console.error(error);
    }
    // web3.eth.sendTransaction({
    //   from: App.account,
    //   to: App.PC.address,
    //   value: amount * ((10)**18)
    // }, function(error,hash){
    //   console.log(error)
    // })
    const balanceNow = await App.PC.showEtherBalance.call()
    //window.location.reload()
  },

  transactionsOfProjectDonor: async () => {
    const globalIndex = $('#projID1').val()
    const indexMap = await App.PC.projectMap(globalIndex)
    
    const projAdmin = indexMap[0]
    const projAdminIndex = indexMap[1].toNumber()

    const proj = await App.PC.viewProject.call(projAdmin,projAdminIndex)

    const $viewAllTransactionsTemplateDonor = $('.viewAllTransactionsTemplateDonor')
    const tsize = proj[6].toNumber()
    for (var i = 0; i < tsize; i++) {
      
      const transaction = await App.PC.viewSingleTransaction.call(projAdmin,projAdminIndex,i)
      const purpose = transaction[0]
      const value = transaction[1].toNumber()
      const proofLink = transaction[2]
      const verified = transaction[3]
      

      // Create the html for the task
      
      const $newViewAllTransactionsTemplateDonor = $viewAllTransactionsTemplateDonor.clone()
      $newViewAllTransactionsTemplateDonor.find('.globalIndexTransactionDonor').html(globalIndex)
      $newViewAllTransactionsTemplateDonor.find('.adminTransactionDonor').html(projAdmin)
      $newViewAllTransactionsTemplateDonor.find('.adminProjIndexTransactionDonor').html(projAdminIndex)
      $newViewAllTransactionsTemplateDonor.find('.TransactionIndexDonor').html(i)
      $newViewAllTransactionsTemplateDonor.find('.purposeTransactionDonor').html(purpose)
      $newViewAllTransactionsTemplateDonor.find('.valueTransactionDonor').html(value)
      $newViewAllTransactionsTemplateDonor.find('.linkTransactionDonor').html(proofLink)
      $newViewAllTransactionsTemplateDonor.find('.verifiedTransactionDonor').html(verified)

      $('#allTransactionsDonor').append($newViewAllTransactionsTemplateDonor)

      $newViewAllTransactionsTemplateDonor.show()
    }
  },
  //ROUTING FUNCS
  goToDonorHome: async () => {

    App.setLoading(305)
  },

  goToDonate: async () => {

    App.setLoading(302)
  },

  goToViewAllProjectsDonor: async () => {

    App.setLoading(301)
  },

  goToViewAllAdminsDonor: async () => {

    App.setLoading(304)
  },

  goToViewTransactionsDonor: async () => {
 
    App.setLoading(303)
  },
  // END OF DONOR FUNCS
















  setLoading: (stateNum) => {

   
    if(App.mainState === 0){
      document.getElementById('MAIN-PAGE').hidden = false
      document.getElementById('PROJECT-CREATOR').hidden = true
      document.getElementById('MODERATOR').hidden = true
      document.getElementById('DONOR').hidden = true
    }
    else if(App.mainState === 1){
      document.getElementById('MAIN-PAGE').hidden = true
      document.getElementById('PROJECT-CREATOR').hidden = false
      document.getElementById('MODERATOR').hidden = true
      document.getElementById('DONOR').hidden = true

      document.getElementById('loader').hidden = true
      document.getElementById('createProjectHTML').hidden = true
      document.getElementById('viewMyProjectsHTML').hidden = true
      document.getElementById('viewAllProjectsHTML').hidden = true
      document.getElementById('viewAllAdminsHTML').hidden = true
      document.getElementById('withdrawFromProjectHTML').hidden = true
      document.getElementById('viewAllTransactionsHTML').hidden = true
      document.getElementById('submitProofHTML').hidden = true
      document.getElementById('viewReputationHTML').hidden = true
      document.getElementById('homeHTML').hidden = true

      if (stateNum == 101) {
        document.getElementById('loader').hidden = false
        App.loading = true
      } else if (stateNum == 102) {
        document.getElementById('createProjectHTML').hidden = false
      } else if (stateNum == 103) {
        document.getElementById('viewMyProjectsHTML').hidden = false
      } else if (stateNum == 104) {
        document.getElementById('viewAllProjectsHTML').hidden = false
      } else if (stateNum == 105) {
        document.getElementById('viewAllAdminsHTML').hidden = false
      } else if (stateNum == 106) {
        document.getElementById('withdrawFromProjectHTML').hidden = false
      } else if (stateNum == 107) {
        document.getElementById('viewAllTransactionsHTML').hidden = false
      } else if (stateNum == 108) {
        document.getElementById('submitProofHTML').hidden = false
      } else if (stateNum == 109) {
        document.getElementById('viewReputationHTML').hidden = false
      } else if (stateNum == 110) {
        document.getElementById('homeHTML').hidden = false
      }
    }
    else if(App.mainState === 2){
      document.getElementById('MAIN-PAGE').hidden = true
      document.getElementById('PROJECT-CREATOR').hidden = true
      document.getElementById('MODERATOR').hidden = false
      document.getElementById('DONOR').hidden = true
      
      document.getElementById('modHomeHTML').hidden = true
      document.getElementById('validateTransactionHTML').hidden = true
      document.getElementById('viewModTokenHTML').hidden = true

      if(stateNum === 201){
        document.getElementById('validateTransactionHTML').hidden = false
      } else if(stateNum === 202){
        document.getElementById('viewModTokenHTML').hidden = false
      } else{
        document.getElementById('modHomeHTML').hidden = false
      }
    }
    else if(App.mainState === 3){
      document.getElementById('MAIN-PAGE').hidden = true
      document.getElementById('PROJECT-CREATOR').hidden = true
      document.getElementById('MODERATOR').hidden = true
      document.getElementById('DONOR').hidden = false
      
      document.getElementById('allProjectDonorHTML').hidden = true
      document.getElementById('donateHTML').hidden = true
      document.getElementById('viewAllTransactionsDonorHTML').hidden = true
      document.getElementById('viewAllAdminsDonorHTML').hidden = true
      document.getElementById('donorHomeHTML').hidden = true

      if (stateNum == 301) {
        document.getElementById('allProjectDonorHTML').hidden = false
      } else if (stateNum == 302) {
        document.getElementById('donateHTML').hidden = false
      } else if (stateNum == 303) {
        document.getElementById('viewAllTransactionsDonorHTML').hidden = false
      } else if (stateNum == 304) {
        document.getElementById('viewAllAdminsDonorHTML').hidden = false
      } else {
        document.getElementById('donorHomeHTML').hidden = false
      }
    }

  },
}

$(() => {
  $(window).load(() => {
    App.load()
  })
})