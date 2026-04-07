const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const serviceImpl = require('./service_impl');

const address = 'localhost:50051';

function main() {
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

  const greetPackageDefinition = protoLoader.loadSync(path.join(__dirname, '../proto/greet.proto'), {
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

  const proto = grpc.loadPackageDefinition(greetPackageDefinition);

  server.addService(proto.greet.GreetService.service, serviceImpl);

  server.bindAsync(address, credentials, (err, _) => {
    if (err) {
      console.error('Server binding error:', err);
      return cleanup(server);
    }

    console.log(`Server running at ${address}`);
  });

}

function cleanup(server) {
  console.log('Cleanup');

  if (server)
    server.forceShutdown();
}


main();
