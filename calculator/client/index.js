const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

function doSum(client) {
  console.log('doSum has been invoked...');
  const request = { a: 605, b: 98 };
  client.sum(request, (err, response) => {
    if (err)
      return console.error('Error:', err);

    console.log('<Client sum> Response:', response);
  });
}

function doPrime(client) {
  console.log('doPrime has been invoked...');
  const request = { a: 12234320 };
  const call = client.prime(request);
  call.on('data', (response) => {
    console.log('<Client prime> Response:', response);
  });
  call.on('error', (err) => {
    console.error('Error:', err);
  });
  call.on('end', () => {
    console.log('<Client prime> Call ended');
  });
}

function doAverage(client) {
  console.log('doAverage has been invoked...');
  const numbers = [1, 3, 5, 7, 15, 20, 35, 50, 51];
  const call = client.average((err, response) => {
    if (err)
      return console.error('Error:', err);

    console.log('<Client average> Response:', response);
  });

  numbers.forEach((number) => {
    call.write({ number });
  });

  call.end();
}

async function doMax(client) {
  console.log('doMax has been invoked...');
  const numbers = [1, 3, 5, 15, 51, 2, 56, 2, 2, 1, 1, 100];
  const call = client.max();
  call.on('data', (response) => {
    console.log('<Client max> Response:', response);
  });
  call.on('error', (err) => {
    console.error('Error:', err);
  });
  call.on('end', () => {
    console.log('<Client max> Call ended');
  });

  for (const n of numbers) {
    call.write({ number: n });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  call.end();
}

function doSqrt(client, num) {
  console.log('doSqrt has been invoked...');
  const request = { number: num };
  client.sqrt(request, (err, response) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('<Client sqrt> Response:', response);
  });
}


function main() {
  const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../proto/calculator.proto'), {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const credentials = grpc.credentials.createInsecure();
  const client = new (
    grpc.loadPackageDefinition(packageDefinition).calculator.CalculatorService)(
      'localhost:50051',
      credentials
    );

  // doSum(client);
  // doPrime(client);
  // doAverage(client);
  // doMax(client);
  doSqrt(client, 81);
  doSqrt(client, -1);

}

main();