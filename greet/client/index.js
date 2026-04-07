const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

function doGreet(client) {
  console.log('doGreet has been invoked...');
  const request = { first_name: 'adri' };
  client.greet(request, (err, response) => {
    if (err)
      return console.error('Error:', err);

    console.log('<Client greet> Response:', response);
  });
}

function doClock(client) {
  console.log('doClock has been invoked...');
  const request = {};
  client.clock(request, (err, response) => {
    if (err)
      return console.error('Error:', err);

    console.log('<Client clock> Response:', response);
  });
}

function doGreetManyTimes(client) {
  console.log('doGreetManyTimes has been invoked...');
  const request = { first_name: 'Marmita' };
  const call = client.greetManyTimes(request);

  call.on('data', (response) => {
    console.log('<Client greetManyTimes> Response:', response);
  });
  call.on('error', (err) => {
    console.error('Error:', err);
  });
  call.on('end', () => {
    console.log('<Client greetManyTimes> Call ended');
  });
}

function doLongGreet(client) {
  console.log('doLongGreet has been invoked...');
  const call = client.longGreet((err, response) => {
    if (err)
      return console.error('Error:', err);
    console.log('<Client longGreet> Response:', response);
  });

  const names = [
    'Adri', 'Marmar', 'Billy', 'Sally', 'Paula',
    'Daisy', 'Xexu', 'Luna', 'Rocky', 'Bella',
  ];
  names.forEach((name) => {
    call.write({ first_name: name });
  });

  call.end();
}

async function doGreetEveryone(client) {
  console.log('doGreetEveryone has been invoked...');
  const call = client.greetEveryone();
  call.on('data', (response) => {
    console.log('<Client greetEveryone> Response:', response);
  });
  call.on('error', (err) => {
    console.error('Error:', err);
  });
  call.on('end', () => {
    console.log('<Client greetEveryone> Call ended on error');
  });

  const names = [
    'Bella', 'Adri', 'Marmar', 'Billy', 'Sally',
    'Paula', 'Daisy', 'Xexu', 'Luna', 'Rocky',
  ];

  // names.forEach((name) => {
  //   call.write({ first_name: name });
  // });

  for (const item of names) {
    call.write({ first_name: item });
  }

  call.end();
}

function doGreetWithDeadline(client, deadlineMs = 1000) {
  console.log('doGreetWithDeadline has been invoked...');
  const request = { first_name: 'Adri' };
  const deadline = new Date(Date.now() + deadlineMs);
  client.greetWithDeadline(request, { deadline }, (err, response) => {
    if (err) {
      if (err.code === grpc.status.DEADLINE_EXCEEDED) {
        console.error('Deadline exceeded:', err);
      } else {
        console.error('Error:', err);
      }
      return;
    }
    console.log('<Client greetWithDeadline> Response:', response);
  });
}

function main() {
  const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../proto/greet.proto'), {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const tls = true;
  let credentials;
  if (tls) {
    credentials = grpc.credentials
      .createSsl(fs.readFileSync(path.join(__dirname, '../../ssl/ca.crt')));
  } else {
    credentials = grpc.credentials.createInsecure();
  }

  const client = new (
    grpc.loadPackageDefinition(packageDefinition).greet.GreetService)(
      'localhost:50051',
      credentials
    );

  // doGreet(client);
  // doClock(client);
  // doGreetManyTimes(client);
  // doLongGreet(client);
  // doGreetEveryone(client);
  doGreetWithDeadline(client, 5000);
  doGreetWithDeadline(client, 200);
}

main();