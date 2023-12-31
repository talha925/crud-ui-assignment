import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import morgan from 'morgan';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890', 20);

import './config/index.mjs';

const app = express();
app.use(express.json());
app.use(cors(["http://localhost:3000", "192.168.2.114"]));

app.use(morgan('combined'));

let productsCollection;

const mongodbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.wy0j9mw.mongodb.net/?retryWrites=true&w=majority`;

console.log("Connecting to MongoDB...");

const connectDB = async () => {
  try {
    const client = new MongoClient(mongodbURI);
    await client.connect();
    const database = client.db('ecom');
    productsCollection = database.collection('products');
    console.log("Connected to MongoDB");

    const port = process.env.PORT || 2000;
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process if there's an error
  }
};

connectDB();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});


app.get("/products", async (req, res) => {

  const cursor = productsCollection.find({});

  try {
    const allProducts = await cursor.toArray();
    res.send({
      message: "all products",
      data: allProducts
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to get products, please try later" });
  }
});

//  https://baseurl.com/product/1231
app.get("/product/:id", async (req, res) => {

  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  try {
    const productData = await productsCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.send({
      message: "product found",
      data: productData
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to get product, please try later" });
  }

});

app.post("/product", async (req, res) => {

  // {
  //   id: 212342, // always a number
  //   name: "abc product",
  //   price: "$23.12",
  //   description: "abc product description"
  // }


  if (!req?.body?.name
    || !req?.body?.price
    || !req?.body?.description) {

    res.status(403).send(`
      required parameter missing. example JSON request body:
      {
        name: "abc product",
        price: "$23.12",
        description: "abc product description"
      }`);
  }


  try {
    const doc = {
      name: req?.body?.name,
      price: req?.body?.price,
      description: req?.body?.description,
    }

    const result = await productsCollection.insertOne(doc);
    console.log("result: ", result);
    res.status(201).send({ message: "created product" });

  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ message: "Failed to add, please try later" })
  }
});

app.put("/product/:id", async (req, res) => {

  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  if (
    !req.body.name
    && !req.body.price
    && !req.body.description) {

    res.status(403).send(`
      required parameter missing. 
      atleast one parameter is required: name, price or description to complete update
      example JSON request body:
      {
        name: "abc product",
        price: "$23.12",
        description: "abc product description"
      }`);
    return;
  }

  let product = {}

  // req.body.name && (product.name = req.body.name);

  if (req.body.name) product.name = req.body.name;
  if (req.body.price) product.price = req.body.price;
  if (req.body.description) product.description = req.body.description;

  try {
    const productData = await productsCollection
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: product }
      );

    console.log("Product updated: ", productData);

    res.send({
      message: "product updated successfully"
    });

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to update product, please try later" });
  }

});

app.delete("/product/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  try {
    const productData = await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    console.log("Product deleted: ", productData);

    res.send({
      message: "product deleted successfully"
    });

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to delete product, please try later" });
  }
});

//hosting index.html file
// app.get("/", express.static("public"));
// app.use(express.static("public"));



// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });