const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 500;

// MiddleWare
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USRPASS}@cluster0.mal3t53.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const queriesCollction = client.db('AltForum').collection('queries');
    const recommendCollection = client.db('AltForum').collection('recommend');

    app.get('/', (req, res) => {
      res.send('Server is Running');
    });

    //Add User Query
    app.post('/addqueries', async (req, res) => {
      const query = req.body;
      const result = await queriesCollction.insertOne(query);
      res.send(result);
    });

    //Load All Query
    app.get('/allqueries', async (req, res) => {
      const search = req.query.search;
      let query = {};
      if (search) {
        query = {
          productName: { $regex: search, $options: 'i' },
        };
      }
      const result = await queriesCollction.find(query).sort({ $natural: -1 }).toArray();
      res.send(result);
      console.log(search);
    });

    // User Query By Email
    app.get('/myqueries', async (req, res) => {
      const email = req.query.email;
      query = { user_email: email };
      const result = await queriesCollction.find(query).toArray();
      res.send(result);
    });

    //User Single Query by ID
    app.get('/myqueries/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollction.findOne(query);
      res.send(result);
    });

    //Load  All Recommendation
    app.get('/recommendation/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { query_id: id };
      const result = await recommendCollection.find(filter).toArray();
      res.send(result);
    });

    //Load Recommendation by Recommender Email
    app.get('/recommendation', async (req, res) => {
      const email = req.query.email;
      const filter = { recommender_email: email };
      const result = await recommendCollection.find(filter).toArray();
      res.send(result);
    });

    //Load Recommendation by Recommender Email
    app.get('/recommendation2', async (req, res) => {
      const email = req.query.email;
      const filter = { user_email: email };
      const result = await recommendCollection.find(filter).toArray();
      res.send(result);
    });

    //Update Recommed Count  Inc
    app.patch('/updaterecommend/:id', async (req, res) => {
      const id = req.params.id;
      const result = await queriesCollction.updateOne({ _id: new ObjectId(id) }, { $inc: { recommendationCount: 1 } });
      res.send(result);
    });

    // Update Recommend Count Dec
    app.patch('/updaterecommend2/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await queriesCollction.updateOne({ _id: new ObjectId(id) }, { $inc: { recommendationCount: -1 } });
      res.send(result);
    });

    //Update post api
    app.patch('/myqueries/:id', async (req, res) => {
      const id = req.params.id;
      const details = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDetails = {
        $set: {
          productName: details.productName,
          productBrand: details.productBrand,
          productIMG: details.productIMG,
          queryTitle: details.queryTitle,
          reason: details.reason,
        },
      };
      const result = await queriesCollction.updateOne(query, updatedDetails, options);
      res.send(result);
    });

    //Delete Post API
    app.delete('/myqueries/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await queriesCollction.deleteOne(filter);
      res.send(result);
    });

    //Delete Recommendation api
    app.delete('/recommend/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await recommendCollection.deleteOne(filter);
      res.send(result);
    });

    //Add Recommend API
    app.post('/recommend', async (req, res) => {
      const query = req.body;
      const result = await recommendCollection.insertOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is Running');
});

app.listen(port, () => {
  console.log(`Server is running port : ${port}`);
});
