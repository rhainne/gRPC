const grpc = require('@grpc/grpc-js');

exports.sum = (call, callback) => {
  callback(null, { result: call.request.a + call.request.b });
}

exports.prime = (call) => {
  let n = call.request.a;
  let divisor = 2;
  call.on('cancelled', () => {
    console.log('Client cancelled the request');
  });

  while (n > 1) {
    if (n % divisor === 0) {
      console.log('Computing divisors for', n, 'with divisor', divisor);
      call.write({ result: divisor });
      n = n / divisor;
    } else {
      divisor++;
    }
  }
  call.end();
}

exports.average = (call, callback) => {
  let sum = 0;
  let count = 0;

  call.on('data', (request) => {
    sum += request.number
    count++;
  });

  call.on('end', () => {
    callback(null, { result: sum / count });
  });
}

exports.max = (call) => {
  let max = Number.MIN_SAFE_INTEGER;
  call.on('data', (request) => {
    console.log("Received number:", request.number);

    if (request.number > max) {
      max = request.number;
      call.write({ result: max });
    }
  });
  call.on('end', () => {
    call.end();
  });
};


exports.sqrt = (call, callback) => {
  const number = call.request.number;
  if (number < 0) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: `Cannot compute square root of a negative number: ${number}`
    });
  } else {
    callback(null, { result: Math.sqrt(number) });
  }
}