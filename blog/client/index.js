const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

function createPost(client, post) {
  return new Promise((resolve, reject) => {
    client.CreatePost(post, (error, response) => {
      if (error) {
        reject(error);
      } else {
        console.log("<createPost> Response from server:", response);
        resolve(response);
      }
    });
  });
}

function readPost(client, id) {
  return new Promise((resolve, reject) => {
    client.ReadPost({ id }, (error, response) => {
      if (error)
        reject(error);

      console.log("<readPost> Response from server:", response);
      resolve();
    });
  });
}

function readPosts(client) {
  return new Promise((resolve, reject) => {
    const call = client.ReadPosts({});
    call.on('data', (response) => {
      console.log("<readPosts> Response from server:", response);
    });
    call.on('error', (error) => {
      reject(error);
    });
    call.on('end', () => {
      resolve();
    });
  });
}

function updatePost(client, post) {
  return new Promise((resolve, reject) => {
    client.UpdatePost(post, (error, response) => {
      if (error)
        reject(error);

      resolve(response);
    });
  });
}

function replacePost(client, post) {
  return new Promise((resolve, reject) => {
    client.ReplacePost(post, (error, response) => {
      if (error)
        reject(error);

      resolve(response);
    });
  });
}

async function main() {
  const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../proto/blog.proto'), {
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
    grpc.loadPackageDefinition(packageDefinition).blog.BlogService)(
      'localhost:50051',
      credentials
    );

  // await readPost(client, '69d176c7c6f0be5b5fd092ac');
  // const it = await createPost(client, {
  //   author_id: 'adri',
  //   title: 'Package Managers are Evil',
  //   content: 'Just created'
  // });

  // const updatedPost = await updatePost(client, {
  //   id: '69d17607c6f0be5b5fd092aa',
  //   author_id: 'not adri',
  //   content: 'Just updated'
  // });

  // const replacedPost = await replacePost(client, {
  //   id: '69d17624c6f0be5b5fd092ab',
  //   author_id: 'marmar',
  //   content: 'Just replaced'
  // });

  readPosts(client);

}

main();