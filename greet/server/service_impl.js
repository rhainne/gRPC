exports.greet = (call, callback) => {
  const name = call.request.first_name || 'World';
  callback(null, { result: `<Service implementation> Hello, ${name}!` });
}

exports.clock = (call, callback) => {
  const now = new Date().toString();
  callback(null, { result: `${now}` });
};

exports.greetManyTimes = (call) => {
  const name = call.request.first_name || 'World';
  let count = 0;

  const intervalId = setInterval(() => {
    if (count >= 10) {
      clearInterval(intervalId);
      call.end();
      return;
    }
    call.write({
      result: `<Server stream service implementation> Hello, ${name}! (${++count}) at ${new Date().toString()}`
    });
  }, 500);
};

exports.longGreet = (call, callback) => {
  let result = '<Client stream service implementation> Hello, ';
  call.on('data', (request) => {
    result += `${request.first_name}, `;
  });

  call.on('end', () => {
    callback(
      null,
      { result: result.trim().slice(0, -1) + '!' }
    );
  });
};

exports.greetEveryone = (call) => {
  call.on('data', (request) => {
    console.log("Received from client:", request);

    const name = request.first_name || 'World';
    call.write({
      result: `<Bidirectional stream service implementation> Hello, ${name}! at ${new Date().toString()}`
    });
  });

  call.on('end', () => {
    call.write({ result: `Goodbye! at ${new Date().toString()}` });
    call.end();
  });
};

exports.greetWithDeadline = (call, callback) => {
  const name = call.request.first_name || 'World';
  const deadline = call.getDeadline();

  const checkInterval = setInterval(() => {
    if (call.cancelled) {
      console.log('Request was cancelled by the client.');
      clearInterval(checkInterval);
      return;
    }
    const now = new Date();
    if (now >= deadline) {
      console.log('Deadline exceeded before response was sent.');
      clearInterval(checkInterval);
      return;
    } else {
      console.log('Processing request...');
    }
  }, 100);

  setTimeout(() => {
    if (!call.cancelled) {
      callback(null, { result: `<Deadline-aware (timeout) service implementation> Hello, ${name}!` });
    }
    clearInterval(checkInterval);
  }, 3000);
};