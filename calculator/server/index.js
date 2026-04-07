const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const serviceImpl = require('../../calculator/server/service_impl');

const address = 'localhost:50051';

function main() {
  const server = new grpc.Server();
  const credentials = grpc.ServerCredentials.createInsecure();

  const calculatorPackageDefinition = protoLoader.loadSync(path.join(__dirname, '../proto/calculator.proto'), {
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

  const proto = grpc.loadPackageDefinition(calculatorPackageDefinition);

  server.addService(proto.calculator.CalculatorService.service, serviceImpl);

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
