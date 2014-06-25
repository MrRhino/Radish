var express = require('express');
var app = express();
app.use(express.bodyParser());
var nohm = require('nohm').Nohm;

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);

  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

nohm.setClient(redis);

var port = process.env.PORT || 3000;

var Product = nohm.model('Product', {
  properties: {
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    price: {
      type: 'integer',
    }
  }
});

var getList = function (req, res) {
    Product.find(function (err, ids) {
    var products = [];
    var len = ids.length;
    var count = 0;
    console.log(ids, 'ids');
    if(ids.length === 0) {
      res.send([]);

    } else {
      ids.forEach(function (id) {
        var product = new Product();
        product.load(id, function (err, props) {
          products.push({id: this.id, name: props.name, description: props.description, price: props.price});
          if (++count === len) {
            res.send(products);
          }
        });
      });
    }
  });
}

var getDetails = function (req, res) {
  Product.load(req.params.id, function (err, properties) {
    if(err) {
      res.send(404);
    } else {
      res.send(properties);
    }
  });
};

var deleteItem = function (req, res) {
  var product = new Product();
  product.id = req.params.id;
  product.remove(function (err) {
    res.send(204);
  });
}

var createItem = function (req, res) {
  var product = new Product();
  product.p(req.body);
  product.save(function (err) {
    res.send(product.allProperties(true));
  });
}

var updateItem = function (req, res) {
  var product = new Product();
  product.id = req.params.id;
  product.p(req.body);
  product.save(function (err) {
    res.send(product.allProperties(true));
  });
}

// CORS

app.all('*', function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "HEAD, POST, GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.options('*', function(req, res){
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
    res.send(200);
});

app.get('/products', getList);
app.get('/products/:id', getDetails);
app.del('/products/:id', deleteItem);
app.post('/products', createItem);
app.put('/products/:id', updateItem);

app.listen(port);

