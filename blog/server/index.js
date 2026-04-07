const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const serviceImpl = require('./service_impl');
const { MongoClient } = require('mongodb');

const address = 'localhost:50051';
const uri = 'mongodb://root:root@localhost:27018/';
const mongoClient = new MongoClient(uri);
global.collection = undefined;

async function main() {
  const server = new grpc.Server();

  const tsl = true;
  let credentials;
  if (tsl) {
    const rootCert = fs.readFileSync(path.join(__dirname, '../../ssl/ca.crt'));
    const privateKey = fs.readFileSync(path.join(__dirname, '../../ssl/server.key'));
    const certChain = fs.readFileSync(path.join(__dirname, '../../ssl/server.crt'));

    credentials = grpc.ServerCredentials.createSsl(rootCert, [
      {
        private_key: privateKey,
        cert_chain: certChain,
      }
    ]);
  } else {
    credentials = grpc.ServerCredentials.createInsecure();
  }

  const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../proto/blog.proto'), {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down server...');
    cleanup(server);
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);

  await mongoClient.connect();
  const database = mongoClient.db('blog');
  global.collection = database.collection('blog');

  server.addService(proto.blog.BlogService.service, serviceImpl);

  server.bindAsync(address, credentials, (err, _) => {
    if (err) {
      console.error('Server binding error:', err);
      return cleanup(server);
    }

    console.log(`Server running at ${address}`);
  });
}

async function cleanup(server) {
  console.log('Cleanup');

  if (server) {
    await mongoClient.close();
    server.forceShutdown();
  }
}

main().catch(cleanup);
// main();