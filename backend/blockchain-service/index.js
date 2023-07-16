const express = require('express');
const cors = require('cors')
const app = express();
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use(cors())
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-lib');
const utf8Decoder = new TextDecoder();
const Keycloak = require('keycloak-connect');
const session = require('express-session');
const crypto = require('crypto');
const uuid = require('uuid');
var memoryStore = new session.MemoryStore();
var keycloak = new Keycloak({ store: memoryStore });
const { SignPdf } = require('node-signpdf');
const forge = require('node-forge');
//session
app.use(session({
  secret:'thisShouldBeLongAndSecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

app.use(keycloak.middleware());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Configure body-parser middleware
app.use(express.urlencoded({ extended: true }));



// peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'
// ./network.sh down; ./network.sh up createChannel -ca; ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript
app.post('/sign_contract', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // Extract document_id and signatory from the request body
    userid = req.kauth.grant.access_token.content.sub
    const { document_id } = req.body;
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
        await registerUser(userid);
    }
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('basic');
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    // signPdfX509(result.file_path, identity.credentials.certificate, identity.credentials.privateKey)
    // Submit the specified transaction.
    timestamp = new Date().toISOString()
    await contract.submitTransaction('SignAsset', document_id, userid, timestamp);
    console.log('Transaction has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();

    res.status(200).json({ message: 'Document signed successfully', id: document_id });

  } catch (error) {
    const regex = /message=(.*?)\n/g;
    const matches = [];
    let match;

    while ((match = regex.exec(error.message)) !== null) {
    matches.push(match[1]);
    }
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to sign document', message: matches });
  }
});
app.get('/contract/:document_id', keycloak.protect(), upload.single('pdf'), async (req, res) => {
    try {
        // get sub from token
        userid = req.kauth.grant.access_token.content.sub
        document_id = req.params.document_id
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
          await registerUser(userid);
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });
    
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
    
        // Get the contract from the network.
        const contract = network.getContract('basic');
    
        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);

        res.status(200).json(result);
        
    }catch (error) {
        const regex = /message=(.*?)\n/g;
        const matches = [];
        let match;
    
        while ((match = regex.exec(error.message)) !== null) {
        matches.push(match[1]);
        }
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to get contract', message: matches });
      }
});

app.head('/contracts/:document_id', keycloak.protect(), upload.single('pdf'), async (req, res) => {
    try {
        console.log(req.params.document_id)
        // get sub from token
        userid = req.kauth.grant.access_token.content.sub
        document_id = req.params.document_id
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
          await registerUser(userid);
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });
    
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
    
        // Get the contract from the network.
        const contract = network.getContract('basic');
    
        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('AssetExists', document_id);
    
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);
    
        // Disconnect from the gateway.
        await gateway.disconnect();
        if (result) {
            res.status(200).json({ message: 'Document exists' });
        }
        else {
            res.status(404).json({ message: 'Document does not exist' });
        }
    
      } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Something Went Wrong' });
      }
    });
        
app.post('/create_contract', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    if (req.file) {
      console.log('File uploaded successfully.');
    } else {
      res.status(400).send('No pdf uploaded.');
    }
    if (req.file.mimetype !== 'application/pdf') {
        res.status(400).send('File is not pdf.');
    }
    // generate id
    const id = "SIGN-" + uuid.v4()
    timestamp = new Date().toISOString()
    // make an hash from the pdf file
    file_path = req.file.path
    const fileBuffer = fs.readFileSync(file_path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);

    const hex = hashSum.digest('hex');

    // check if file is pdf
    userid = req.kauth.grant.access_token.content.sub
    // Extract document_id and signatory from the request body
    const ccpPath = path.resolve('/Users/nicolae/Desktop/Projects/Personal/Blockchain-business-process/fabric-samples/', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    // Create a new CA client for interacting with the CA.
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    // wait for peer endorsement
    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(userid);
    if (!identity) {
        await registerUser(userid);
    }
    // signPdfX509(file_path, identity.credentials.certificate, identity.credentials.privateKey)
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('basic');

    // Submit the specified transaction.
    await contract.submitTransaction('CreateAsset',id, userid, hex,file_path,timestamp);
    console.log('Transaction has been submitted');
    await gateway.disconnect();

    res.status(200).json({ message: 'Document created', id: id });
  } catch (error) {
    const regex = /message=(.*?)\n/g;
    const matches = [];
    let match;

    while ((match = regex.exec(error.message)) !== null) {
    matches.push(match[1]);
    }
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to create contract', message: matches });
  }
});
app.get('/contracts/:document_id/pdf', keycloak.protect(), upload.single('pdf'), async (req, res) => {
    try {
        // get sub from token
        userid = req.kauth.grant.access_token.content.sub
        document_id = req.params.document_id
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
          await registerUser(userid);
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });
    
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
    
        // Get the contract from the network.
        const contract = network.getContract('basic');
    
        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);

    
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);
        pdf_location = path.join(result.path_on_disk)
    
        // Disconnect from the gateway.
        await gateway.disconnect();
    
        // read pdf as binary
        fs.readFile(pdf_location, (err, data) => {
          if (err) {
            console.error(err);
            res.status(err.status).end();
            return;
        }
        res.writeHead(200, {'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=download.pdf'});
        res.end(data, 'binary');
        });
    
      } catch (error) {
        const regex = /message=(.*?)\n/g;
        const matches = [];
        let match;
    
        while ((match = regex.exec(error.message)) !== null) {
        matches.push(match[1]);
        }
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to get contract', message: matches });
      }
});
app.get('/contracts', keycloak.protect(), async (req, res) => {
  try {
    // get sub from token
    userid = req.kauth.grant.access_token.content.sub
    // Extract document_id and signatory from the request body
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
      await registerUser(userid);
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
    const regex = /message=(.*?)\n/g;
    const matches = [];
    let match;

    while ((match = regex.exec(error.message)) !== null) {
    matches.push(match[1]);
    }
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});
// Serve Swagger API docs with OAuth2 configuration
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      oauth: {
        clientId: 'Frontend',
        appName: 'Swagger OAuth2',
        usePkceWithAuthorizationCodeGrant: true
      }
    }
  }));
  

// register user
registerUser = async (userId) => {
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
          return res.status(500).json({ error: 'User already exists' });
        }
    
        // Must use an admin identity to register a new user
        identity = await wallet.get('admin');
        if (!identity) {
          console.log('An identity for the admin user does not exist in the wallet');
          console.log('Enroll the admin user before retrying');
          return res.status(500).json({ error: 'Admin user does not exist' });
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
    
        return
    }

// enroll admin
createAdmin = async () => {
        try {
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
    
          } catch (error) {
            console.error(`Failed to enroll admin user: ${error}`);
          }
        }

function generateP12Certificate(x509, privateKey) {

  const cert = forge.pki.certificateFromPem(x509);
  const pk = forge.pki.privateKeyFromPem(privateKey);

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(pk, cert, null); // Set password parameter to null
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

  return p12Der;
}
const signPdfX509 = async (pdfLocation, x509, privateKey) => {;

  fs.readFile(pdfLocation, (err, data) => {
    if (err) {
      console.error(err);
      throw new Error('Unable to read file');
    }
    const p12 = generateP12Certificate(x509, privateKey)
    const signedPdf = signer.sign(data,p12);

    fs.writeFileSync(pdfLocation, signedPdf);
  });
};

createAdmin()
const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
