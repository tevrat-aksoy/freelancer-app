# freelancer-app

This projects is a freelancer platform built on Near blockchain. Freelancers and employers can create accounts from Near wallet and use this project.


# Deploying and using this project

To deploy and use this app near wallet should be created. After that wallet can be linked to this app by near login command.

	near login

Using the below comments this app can be deployed to near testnet

	yarn build:release
	
	near dev-deploy ./build/release/freelancerapp.wasm

	export CONTRACT=<dev account>
	
For creating freelancer account registerFreelancer function used. 

	near call $CONTRACT registerFreelancer '{ "_name":  "account name", "_hourlyRate": "20","_freeToOffer": true}'  --accountId <accountID>

Employer accounts created using registerEmployer function.

 	 near call $CONTRACT registerEmployer '{ "_name": "employer name" }'  --accountId <accountID>

Projects can be created registered employer accounts. And freelancers can apply for this projects.

	near call $CONTRACT registerProject '{ "_name":  "near training", "_price": "1","_timeLimit": "2 weeks"}'  --accountId account2.tevrat2.testnet
  
