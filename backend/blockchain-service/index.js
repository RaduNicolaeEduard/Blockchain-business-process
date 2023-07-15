const express = require('express')
const app = express()
app.use(express.json());
const port = 3000
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-lib');
const utf8Decoder = new TextDecoder();
// peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'
// ./network.sh down; ./network.sh up createChannel -ca; ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript
app.post('/sign_document', async (req, res) => {
    try {
        // Extract document_id and signatory from the request body
        const { document_id, userid } = req.body;

        // load the network configuration
        const ccpPath = path.resolve('/Users/nicolae/Desktop/Projects/Personal/Blockchain-business-process/fabric-samples/', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(userid);
        if (!identity) {
            console.error('User identity not found in the wallet');
            return res.status(500).json({ error: 'User identity not found' });
          }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('basic');

        // Submit the specified transaction.
        await contract.submitTransaction('SignAsset', document_id, userid);
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

        res.status(200).json({ message: 'Document signed successfully' });

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to sign document' });
    }
});

app.post('/create_document', async (req, res) => {
    try {
        // Extract document_id and signatory from the request body
        const { document_id, userid, docHash } = req.body;
        // load the network configuration
        const ccpPath = path.resolve('/Users/nicolae/Desktop/Projects/Personal/Blockchain-business-process/fabric-samples/', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(userid);
        if (!identity) {
          console.error('User identity not found in the wallet');
          return res.status(500).json({ error: 'User identity not found' });
        }
        console.log(identity.credentials.certificate)
        console.log(identity.credentials.privateKey)
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('basic');

        // Submit the specified transaction.
        await contract.submitTransaction('CreateAsset', document_id, userid,docHash);
        console.log('Transaction has been submitted');
        await gateway.disconnect();

        res.status(200).json({ message: 'Document signed successfully' });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to sign document' });
    }
});

app.post('/register_user', async (req, res) => {
    try {
        const { userId, password } = req.body;

        // load the network configuration
        const ccpPath = path.resolve('/Users/nicolae/Desktop/Projects/Personal/Blockchain-business-process/fabric-samples/', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(userId);
        if (identity) {
            console.log('An identity for the user already exists in the wallet');
            return;
        }

        // Must use an admin identity to register a new user
        identity = await wallet.get('admin');
        if (!identity) {
            console.log('An identity for the admin user does not exist in the wallet');
            console.log('Enroll the admin user before retrying');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(identity.type);
        const adminUser = await provider.getUserContext(identity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: userId,
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put(userId, x509Identity);
        
        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        res.status(500).json({ error: 'Failed to register user' });
    }
});
app.post('/enroll_admin', async (req, res) => {
    try {
        // load the network configuration
        const ccpPath = path.resolve('/Users/nicolae/Desktop/Projects/Personal/Blockchain-business-process/fabric-samples/', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);

        res.status(200).json({ message: 'Admin enrolled successfully' });
    } catch (error) {
        console.error(`Failed to enroll admin user: ${error}`);
        res.status(500).json({ error: 'Failed to enroll admin user' });
    }
});

app.get('/get_all_assets', async (req, res) => {
    try {
        // Extract document_id and signatory from the request body
        const { userid } = req.body;

        // load the network configuration
        const ccpPath = path.resolve('/Users/nicolae/Desktop/Projects/Personal/Blockchain-business-process/fabric-samples/', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(userid);
        if (!identity) {
            console.error('User identity not found in the wallet');
            return res.status(500).json({ error: 'User identity not found' });
          }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('basic');

        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('GetAllAssets');

        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);

        // Disconnect from the gateway.
        await gateway.disconnect();

        res.status(200).json(result);

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to sign document' });
    }
});

async function signPdfWithX509(pdfBytes, certificate, privateKey) {
    // Load the PDF document
    const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);
  
    // Create a signature widget
    const widget = pdfDoc.getForm().createSignature(certificate);
  
    // Set the signature appearance
    const { width, height } = pdfDoc.getPages()[0].getSize();
    widget.setAppearance(
      pdfLib.StandardFonts.Helvetica,
      {
        x: width / 2 - 125,
        y: height / 2 - 15,
        width: 250,
        height: 30,
        fontSize: 10,
        color: pdfLib.rgb(0, 0, 0),
      }
    );
  
    // Sign the document using the private key
    await pdfDoc.sign(widget, privateKey);
  
    // Serialize the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
  
    return modifiedPdfBytes;
  }

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
