const grpc = require('@grpc/grpc-js');

const { MongoClient, ObjectId } = require('mongodb');


exports.createPost = async (call, callback) => {
  try {
    console.log("request", call.request);
    console.log("request.post", call.request.post);

    const post = call.request;
    const result = await collection.insertOne(postToDocument(post));
    if (checkNotAcknowledged(result, callback))
      return;

    callback(null, { id: result.insertedId.toString() });
  } catch (err) {
    internalError(err, callback);
  }
};

exports.readPost = async (call, callback) => {
  try {
    const id = checkOID(call.request.id, callback);
    if (!id) return;

    const result = await collection.findOne({ _id: id });

    if (checkNotFound(result, callback))
      return;

    callback(null, documentToPost(result));
  } catch (err) {
    internalError(err, callback);
  }
};

exports.replacePost = async (call, callback) => {
  try {
    const post = call.request;
    const id = checkOID(post.id, callback);
    if (!id) return;

    const result = await collection
      .replaceOne({ _id: id }, postToDocument(post));

    if (checkNotFound(result, callback))
      return;

    callback(null, documentToPost(result));
  } catch (err) {
    internalError(err, callback);
  }
};

exports.updatePost = async (call, callback) => {
  try {
    const post = call.request;
    const id = checkOID(post.id, callback);
    if (!id) return;

    const updateDoc = {};
    if (post.author_id) updateDoc.author_id = post.author_id;
    if (post.title) updateDoc.title = post.title;
    if (post.content) updateDoc.content = post.content;

    const result = await collection
      .updateOne({ _id: id }, { $set: updateDoc });

    if (checkNotFound(result, callback))
      return;

    callback(null, documentToPost(result));
  } catch (err) {
    internalError(err, callback);
  }
};

////////////
// Helpers //
////////////
function postToDocument(post) {
  return {
    author_id: post.author_id,
    title: post.title,
    content: post.content
  };
}

function documentToPost(doc) {
  return {
    id: doc._id.toString(),
    author_id: doc.author_id,
    title: doc.title,
    content: doc.content
  };
}

const internalError = (err, callback) => {
  console.error('Internal error:', err);
  callback({
    code: grpc.status.INTERNAL,
    message: err.toString(),
  });
};

function checkNotAcknowledged(result, callback) {
  if (!result.acknowledged) {
    callback({
      code: grpc.status.INTERNAL,
      message: 'Operation not acknowledged by MongoDB',
    });
    return true;
  }
  return false;
}

function checkOID(id, callback) {
  try {
    return new ObjectId(id);
  } catch (err) {
    callback({
      code: grpc.status.INTERNAL,
      message: `Invalid ObjectId: ${id}`,
    });
    return null;
  }
}

function checkNotFound(result, callback) {
  if (!result || result.matchedCount === 0) {
    callback({
      code: grpc.status.NOT_FOUND,
      message: 'Blog post not found',
    });
    return true;
  }
  return false;
}