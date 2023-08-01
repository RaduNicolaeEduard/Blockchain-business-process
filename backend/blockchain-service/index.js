const express = require('express');
const cors = require('cors')
const app = express();
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use(cors())
const { Sequelize, DataTypes } = require('sequelize');
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
const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({ store: memoryStore });
const { SignPdf } = require('node-signpdf');
const forge = require('node-forge');
const morgan = require('morgan')
const compression = require('compression')
const https = require('http');
const { Kafka } = require('kafkajs')
const axios = require("axios");
const { keycloaksearch, KeycloakAdminAccessToken } = require('./keycloak');
const pdf_thumb = require('pdf-thumbnail');
require('dotenv').config({path: './.env'});
const kafka = new Kafka({
  clientId: 'blockchain-service',
  brokers: ['localhost:9092'],
})
const producer = kafka.producer()
app.use(compression())
app.use(morgan('tiny'))
app.use(session({
  secret:'thisShouldBeLongAndSecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));
// const sequelize = new Sequelize('mariadb://root:signpass@127.0.0.1:3306/test');
const sequelize = new Sequelize(process.env.BLOCKCHAIN_SERVICE_DATABASE_NAME, process.env.BLOCKCHAIN_SERVICE_DATABASE_USER, process.env.BLOCKCHAIN_SERVICE_DATABASE_PASSWORD, {
  host: process.env.BLOCKCHAIN_SERVICE_DATABASE_HOST,
  dialect: 'mariadb',
  dialectOptions: {
    // Your mariadb options here
    // connectTimeout: 1000
  }
});

const invite = sequelize.define('invite', {
  owner: DataTypes.STRING,
  signatory: DataTypes.STRING,
  caseId: DataTypes.STRING,
});

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

app.post('/invite', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    userid = req.kauth.grant.access_token.content.upn
    const { document_id, signatory } = req.body;
    if(userid == signatory){
      res.status(400).json({ error: "You cannot invite yourself"})
      return
    }
    const { contract, gateway, identity } = await connect_to_chaincode(userid);
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    const adminAccessToken = await KeycloakAdminAccessToken();
    const response = await keycloaksearch.get('/users', {
      params: {
        search: signatory,
      },
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });
    const users = response.data;
    found = false;
    users.forEach(user => {
      if (user.email = signatory){
        found = true
      }
    });
    if(!found){
      res.status(404).json({ error: "User not found"})
      return
    }
    const invited = await invite.findOne({ where: { owner: userid, signatory: signatory, caseId: result.ID } });
    if (invited){
      res.status(400).json({ error: "User already invited"})
      return
    }
    if(result.owner == userid){
      await invite.create({
        caseId: result.ID,
        owner: userid,
        signatory: signatory
      });
    }else {
      res.status(500).json({ error: "You are not the owner of the document"})
      return
    }
    res.status(200).json({ message: 'Person invited successfully', id: document_id });
  } catch (error) {
    res.status(500).json({ error: "Failed to invite person"})
  }
});

check_if_user_is_invited = async (userid, document_id) => {
  const invited = await invite.findOne({ where: { signatory: userid, caseId: document_id } });
  if (invited){
    return true
  }else{
    return false
  }
}

app.get('/contract/:document_id/thumbnail', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // get sub from token
    userid = req.kauth.grant.access_token.content.upn
    document_id = req.params.document_id
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    // Submit the specified transaction.
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    if(result.owner != userid || !check_if_user_is_invited(userid, document_id)){
      res.status(401).json({ error: 'You are not authorized' });
      return
    }
    latest_version = result.signatories.length - 1;
    pdf_location = path.join(result.signatories[latest_version].path_on_disk)

    pdfBuffer = fs.readFileSync(pdf_location);
    pdf_thumb(pdfBuffer).then(data => {

      // make temporary file
      const temp_file = path.join(process.cwd(), 'temp', document_id + ".jpg");
      data.pipe(fs.createWriteStream(temp_file)).on('finish', function () {
        blob = fs.readFileSync(temp_file);
        res.writeHead(200, {'Content-Type': 'image/jpg', 'Content-Disposition': 'attachment; filename=download.jpg'});
        res.end(blob, 'binary');
        fs.unlink(temp_file, (err) => {
          if (err) {
            console.error(err)
            return
          }
        }
        )
      });
    }, err => {
      console.error(err);
      res.status(500).end();
    });
    await gateway.disconnect();

  } catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});


app.get('/contract/:document_id/signatories', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    userid = req.kauth.grant.access_token.content.upn
    document_id = req.params.document_id
    const { contract, gateway, identity } = await connect_to_chaincode(userid);
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    // Disconnect from the gateway.
    await gateway.disconnect();
    invited = await invite.findAll({ where: { caseId: document_id } });
    signatories = []
    for(let i = 0; i < invited.length; i++){
      signatories.push(invited[i].signatory)
    }
    if(result.owner == userid){
      res.status(200).json(signatories);
      return
    }
    if(check_if_user_is_invited(userid, document_id)){
      res.status(200).json(signatories);
      return
    }
    res.status(401).json({ error: 'You are not authorized' });
  } catch (error) {
    matches = error_message(error)
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});
// peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'
// ./network.sh down; ./network.sh up createChannel -ca; ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript
app.post('/sign_contract', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // Extract document_id and signatory from the request body
    userid = req.kauth.grant.access_token.content.upn
    const { document_id, sign_document, comment } = req.body;
    if(!await check_if_user_is_invited(userid, document_id)){
      res.status(400).json({ error: "You are not invited to sign this document"})
      return
    }
    const { contract, gateway, identity } = await connect_to_chaincode(userid);
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    // check if user signed already the document
    for(let i = 0; i < result.signatories.length; i++){
      if(result.signatories[i].signatory == userid){
        res.status(400).json({ error: "You already signed this document"})
        return
      }
    }
    let hex
    if (sign_document == "true"){
      latest_version = result.signatories.length - 1;
      filepath = await move_pdf_based_on_caseid(result.signatories[latest_version].path_on_disk, document_id)
      await new Promise(resolve => setTimeout(resolve, 50));
      const fileBuffer1 = fs.readFileSync(filepath);
      const hashSum1 = crypto.createHash('sha256');
      hashSum1.update(fileBuffer1);
      const hex_check = hashSum1.digest('hex');
      await signPdfX509(filepath, identity.credentials.certificate, identity.credentials.privateKey, userid)
      timeout = 0
      // continue when sha of the file has changed
      while (true){
        const fileBuffer = fs.readFileSync(filepath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const new_hex = hashSum.digest('hex');
        if(new_hex != hex_check){
          break
        }
        timeout += 1
        if(timeout > 100){
          fs.unlink(file_path, (err) => {
            if (err) {
              console.error(err)
              return
            }
          }
          )
          res.status(500).json({ error: 'Failed to sign document', message: "Timeout" });
          return
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      const fileBuffer = fs.readFileSync(filepath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      hex = hashSum.digest('hex');
    }else{
      filepath = await move_pdf_based_on_caseid(req.file.path, document_id)
      const fileBuffer = fs.readFileSync(filepath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      hex = hashSum.digest('hex');
    }
    // Submit the specified transaction.
    timestamp = new Date().toISOString()

    await contract.submitTransaction('SignAsset', document_id, userid, hex, filepath, timestamp, comment);
    console.log('Transaction has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();

    res.status(200).json({ message: 'Document signed successfully', id: document_id });

  } catch (error) {
    matches = error_message(error)
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to sign document', message: matches });
  }
});
app.get('/contract/:document_id', keycloak.protect(), upload.single('pdf'), async (req, res) => {
    try {
        // get sub from token
        userid = req.kauth.grant.access_token.content.upn
        document_id = req.params.document_id
        // Create a new CA client for interacting with the CA.
        const { contract, gateway, identity } = await connect_to_chaincode(userid);
    
        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);
        // remove path_on_disk from response which is in the array signatories
        for(let i = 0; i < result.signatories.length; i++){
          delete result.signatories[i].path_on_disk
        }
        if(result.owner == userid){
          res.status(200).json(result);
          return
        }
        if(check_if_user_is_invited(userid, document_id)){
          res.status(200).json(result);
          return
        }
        res.status(401).json({ error: 'You are not authorized' });
        
    }catch (error) {
      matches = error_message(error)
        res.status(500).json({ error: 'Failed to get contract', message: matches });
      }
});

app.head('/contracts/:document_id', keycloak.protect(), upload.single('pdf'), async (req, res) => {
    try {
        console.log(req.params.document_id)
        // get sub from token
        userid = req.kauth.grant.access_token.content.upn
        document_id = req.params.document_id
        // Create a new CA client for interacting with the CA.
        const { contract, gateway, identity } = await connect_to_chaincode(userid);
    
        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('AssetExists', document_id);
    
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);
    
        // Disconnect from the gateway.
        await gateway.disconnect();
        if (result) {
          if(result.owner == userid){
            res.status(200).json({ message: 'Document exists' });
            return
          }
          if(check_if_user_is_invited(userid, document_id)){
            res.status(200).json({ message: 'Document exists' });
            return
          }
          res.status(401).json({ error: 'You are not authorized' });
        }
        else {
            res.status(404).json({ message: 'Document does not exist' });
        }
    
      } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Something Went Wrong' });
      }
    });

app.post('/update_status', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // Extract document_id and signatory from the request body
    userid = req.kauth.grant.access_token.content.upn
    const { document_id, status, version } = req.body;
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);
    await contract.submitTransaction('changeStatus', document_id, userid, status, version);
    console.log('Transaction has been submitted');

    await gateway.disconnect();

    res.status(200).json({ message: 'Document status updated successfully', id: document_id });

  } catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to update document status', message: matches });
  }
});
app.post('/file_fingerprint', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // Extract document_id and signatory from the request body
    userid = req.kauth.grant.access_token.content.upn
    const { document_id, status, version } = req.body;
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);
    // read asset
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    const fileBuffer = fs.readFileSync(req.file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    for(let i = 0; i < result.signatories.length; i++){
      if(result.signatories[i].sha256 == hex){
        res.status(200).json({ message: 'Document fingerprint matches', id: document_id, version: i + 1 });
        return
      }
    }
    res.status(400).json({ error: 'Document fingerprint does not match' });
  } catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to update document status', message: matches });
  }
});
app.get('/contract/:document_id/verify', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // get sub from token
    userid = req.kauth.grant.access_token.content.upn
    document_id = req.params.document_id
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    // Submit the specified transaction.
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    latest_version = result.signatories.length - 1;
    pdf_location = result.signatories[latest_version].path_on_disk
    await gateway.disconnect();
    const json_data = {"path": pdf_location} 
    const sign_data = await axios.post(process.env.SIGN_SERVICE_URL, json_data)
    response = sign_data.data
    if(result.owner == userid){
      res.status(200).json ({signatures: response });
      return
    }
    if(check_if_user_is_invited(userid, document_id)){
      res.status(200).json ({signatures: response });
      return
    }
    res.status(401).json({ error: 'You are not authorized' });
  }
  catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});
app.get('/contract/:document_id/:version/verify', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // get sub from token
    userid = req.kauth.grant.access_token.content.upn
    document_id = req.params.document_id
    version = req.params.version - 1;
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    // Submit the specified transaction.
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    pdf_location = result.signatories[version].path_on_disk
    await gateway.disconnect();
    const json_data = {"path": pdf_location} 
    const sign_data = await axios.post(process.env.SIGN_SERVICE_URL, json_data)
    response = sign_data.data
    if(result.owner == userid){
      res.status(200).json ({signatures: response });
      return
    }
    if(check_if_user_is_invited(userid, document_id)){
      res.status(200).json ({signatures: response });
      return
    }
    res.status(401).json({ error: 'You are not authorized' });
  }
  catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to get contract', message: matches });
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
    sign_document = req.body.sign_document
    comment = req.body.comment
    description = req.body.description
    title = req.body.title
    // generate id
    const id = "SIGN-" + uuid.v4()
    timestamp = new Date().toISOString()
    // make an hash from the pdf file
    file_path = await move_pdf_based_on_caseid(req.file.path, id)

    // check if file is pdf
    userid = req.kauth.grant.access_token.content.upn
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    if (sign_document == "true"){
      const fileBuffer = fs.readFileSync(file_path);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      const hex_check = hashSum.digest('hex');
      signPdfX509(file_path, identity.credentials.certificate, identity.credentials.privateKey, userid)

      timeout = 0
      // continue when sha of the file has changed
      while (true){
        const fileBuffer = fs.readFileSync(file_path);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const new_hex = hashSum.digest('hex');
        if(new_hex != hex_check){
          break
        }
        timeout += 1
        if(timeout > 100){
          fs.unlink(file_path, (err) => {
            if (err) {
              console.error(err)
              return
            }
          }
          )
          res.status(500).json({ error: 'Failed to sign document', message: "Timeout" });
          return
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    const fileBuffer1 = fs.readFileSync(file_path);
    const hashSum1 = crypto.createHash('sha256');
    hashSum1.update(fileBuffer1);
    const hex = hashSum1.digest('hex');
    // Submit the specified transaction.
    await contract.submitTransaction('CreateAsset',id, userid, hex,file_path,timestamp,title,description,comment);
    console.log('Transaction has been submitted');
    await gateway.disconnect();

    res.status(200).json({ message: 'Document created', id: id });
  } catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to create contract', message: matches });
  }
});
app.get('/my/contracts', keycloak.protect(), async (req, res) => {
  try {
    userid = req.kauth.grant.access_token.content.upn
    // Extract document_id and signatory from the request body
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    // Submit the specified transaction.
    const resultBytes = await contract.evaluateTransaction('GetMyContracts', userid);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    document_ids = []
    for(let i = 0; i < result.length; i++){
      document_ids.push(result[i].ID)
    }
    // Disconnect from the gateway.
    await gateway.disconnect();

    res.status(200).json(document_ids);

  } catch (error) {
    matches = error_message(error)
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});

app.get('/my/invites', keycloak.protect(), async (req, res) => {
  try {
    userid = req.kauth.grant.access_token.content.upn
    invites = await invite.findAll({ where: { signatory: userid } });
    document_ids = []
    for (let i = 0; i < invites.length; i++){
      document_ids.push(invites[i].caseId)
    }
    res.status(200).json(document_ids);
  } catch (error) {
    matches = error_message(error)
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});

app.get('/contract/:document_id/:version/pdf', keycloak.protect(), upload.single('pdf'), async (req, res) => {
  try {
    // get sub from token
    userid = req.kauth.grant.access_token.content.upn
    document_id = req.params.document_id
    version = req.params.version - 1;
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    // Submit the specified transaction.
    const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);


    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    pdf_location = path.join(result.signatories[version].path_on_disk)
    // Disconnect from the gateway.
    await gateway.disconnect();

    // read pdf as binary
    fs.readFile(pdf_location, (err, data) => {
      if (err) {
        console.error(err);
        res.status(err.status).end();
        return;
    }
    if(result.owner == userid){
      res.writeHead(200, {'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=download.pdf'});
      res.end(data, 'binary');
      return
    }
    if(check_if_user_is_invited(userid, document_id)){
      res.writeHead(200, {'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=download.pdf'});
      res.end(data, 'binary');
      return
    }
    res.status(401).json({ error: 'You are not authorized' });
    res.end(data, 'binary');
    });

  } catch (error) {
    matches = error_message(error)
    res.status(500).json({ error: 'Failed to get contract', message: matches });
  }
});

app.get('/contract/:document_id/pdf', keycloak.protect(), upload.single('pdf'), async (req, res) => {
    try {
        // get sub from token
        userid = req.kauth.grant.access_token.content.upn
        document_id = req.params.document_id

        const { contract, gateway, identity } = await connect_to_chaincode(userid);
        // Submit the specified transaction.
        const resultBytes = await contract.evaluateTransaction('ReadAsset', document_id);

    
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);
        latest_version = result.signatories.length - 1;
        pdf_location = path.join(result.signatories[latest_version].path_on_disk)
    
        // Disconnect from the gateway.
        await gateway.disconnect();
    
        // read pdf as binary
        fs.readFile(pdf_location, (err, data) => {
          if (err) {
            console.error(err);
            res.status(err.status).end();
            return;
        }
        if(result.owner == userid){
          res.writeHead(200, {'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=download.pdf'});
          res.end(data, 'binary');
          return
        }
        if(check_if_user_is_invited(userid, document_id)){
          res.writeHead(200, {'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=download.pdf'});
          res.end(data, 'binary');
          return
        }
        res.status(401).json({ error: 'You are not authorized' });
        res.end(data, 'binary');
        });
    
      } catch (error) {
        matches = error_message(error)
        res.status(500).json({ error: 'Failed to get contract', message: matches });
      }
});
app.get('/contracts', keycloak.protect(), async (req, res) => {
  try {
    userid = req.kauth.grant.access_token.content.upn
    if(!req.kauth.grant.access_token.content.realm_access.roles.includes("admin")){
      res.status(401).json({ error: 'You are not authorized' });
      return
    }
    // Extract document_id and signatory from the request body
    // Create a new CA client for interacting with the CA.
    const { contract, gateway, identity } = await connect_to_chaincode(userid);

    // Submit the specified transaction.
    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);

    // Disconnect from the gateway.
    await gateway.disconnect();

    if(result.owner == userid){
      res.status(200).json(result);
      return
    }
    if(check_if_user_is_invited(userid, document_id)){
      res.status(200).json(result);
      return
    }
    res.status(401).json({ error: 'You are not authorized' });
  } catch (error) {
    matches = error_message(error)
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
  
app.get('*', function(req, res){
  // check if request is of type get
    res.set('Content-Type', 'text/html');
    res.status(404).send(Buffer.from('<h2>404 Not Found</h2> <p>The requested resource was not found on the server.</p> <p>For more information, please refer to the <a href="/api-docs/">API Documentation</a></p>'));
});
move_pdf_based_on_caseid = async (pdfLocation, case_id) => {
  // move the pdf to the case folder
  const case_folder = path.join(process.cwd(), 'cases', case_id);
  if (!fs.existsSync(case_folder)){
    fs.mkdirSync(case_folder);
  }
  cases = await fs.readdirSync(path.join(process.cwd(), 'cases', case_id));
  salt = cases.length + 1
  let new_pdf_location = path.join(case_folder, path.basename(pdfLocation));
  new_pdf_location = new_pdf_location.split('.').slice(0, -1).join('.') + salt + '.pdf';
  fs.copyFile(pdfLocation, new_pdf_location, (err) => {
    if (err) throw err;
  });
  return new_pdf_location
}
error_message = (error) => {
  const regex = /message=(.*?)\n/g;
  const matches = [];
  let match;

  while ((match = regex.exec(error.message)) !== null) {
  matches.push(match[1]);
  }
  console.error(`Failed to submit transaction: ${error}`);
  return matches
}
connect_to_chaincode = async (userid) => {
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
    identity = await wallet.get(userid);
  }
  // Create a new gateway for connecting to our peer node.
  const gateway = new Gateway();
  await gateway.connect(ccp, { wallet, identity: userid, discovery: { enabled: true, asLocalhost: true } });

  // Get the network (channel) our contract is deployed to.
  const network = await gateway.getNetwork('mychannel');

  // Get the contract from the network.
  const contract = network.getContract('basic');

  // Submit the specified transaction.
  return { contract, gateway , identity};
}
// register user
registerUser = async (userId) => {
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

const signPdfX509 = async (pdfLocation, publickey, privateKey, userid) => {
  data = {
    "privateKey": privateKey,
    "publickey": publickey,
    "pdfLocation": pdfLocation,
    "userid": userid
  }
  const dataString = JSON.stringify(data);
  await producer.connect()
  await producer.send({
    topic: 'sign-queue',
    messages: [
      { value: dataString },
    ],
  })
  await producer.disconnect()
};

const ccp = JSON.parse(fs.readFileSync(process.env.ORGANISTAION_CONNECTION_PATH, 'utf8'));
createAdmin()
const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
