/*
# Author:- piyushkumar96 :- supplychain chaincode for tracking the Items
#
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let supplyChainTrackingChaincode = class {

  // ===============================================
  // Init - for Initantiating the Chaincode
  // ===============================================
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('##################### Instantiated Supply Chain Tracking Chaincode #####################');
    return shim.success();
  }

  // ===============================================
  // Init - for Invoking the Chaincode
  // ===============================================
  async Invoke(stub) {
    console.info('##################### Transaction ID: ' + stub.getTxID() + ' #####################');
    console.info('##################### ' + util.format('Args: %j', stub.getArgs()) + ' #####################');

    let ret = stub.getFunctionAndParameters();
    console.info('##################### ' + ret + ' #####################');

    let method = this[ret.fcn];
    if (!method) {
      console.log('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  // ===============================================
  // addOrder - Adding a new order request
  // ===============================================
  async addOrder(stub, args, thisClass) {
    if (args.length != 6) {
      throw new Error('Incorrect number of arguments. Expecting 6');
    }

    // ==== Input sanitation ====
    console.info('--- start init marble ---')
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }
    if (args[3].length <= 0) {
      throw new Error('4th argument must be a non-empty string');
    }
    if (args[4].length <= 0) {
      throw new Error('5th argument must be a non-empty string');
    }
    if (args[5].length <= 0) {
      throw new Error('6th argument must be a non-empty string');
    }

    let orderId = args[0],
      orderName = args[1],
      buyerId = args[2],
      buyerLoc = args[3],
      sellerId = args[4],
      sellerLoc = args[5];

    // ==== Check if Order already exists ====
    let ordId = await stub.getState(orderId);
    if (ordId.toString()) {
      throw new Error('This Order already exists: ' + ordId);
    }

    let orderInfo = {},
      seller = {},
      logistic = {},
      buyer = {};

    seller.sellerId = sellerId
    seller.location = sellerLoc

    logistic.logisticId = "NA"
    logistic.location = "NA"

    buyer.buyerId = buyerId
    buyer.location = buyerLoc

    orderInfo.ordId = orderId
    orderInfo.orderName = orderName
    orderInfo.status = "Order Request by Buyer"
    orderInfo.statusCode = "1"
    orderInfo.tempBreach = "No"
    orderInfo.seller = seller
    orderInfo.logistic = logistic
    orderInfo.buyer = buyer
    orderInfo.timeRaster = []

    // === Save Order to state ===
    await stub.putState(orderId, Buffer.from(JSON.stringify(orderInfo)));

    console.info('- end addOrder function');
  }

  // ===============================================
  // updateStatus - update the status of order
  // ===============================================
  async updateStatus(stub, args, thisClass) {

    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2 arguments');
    }

    let orderid = args[0],
      status = args[1];

    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }

    let orderAsbytes = await stub.getState(orderid);                  //get the order from chaincode state
    if (!orderAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Order does not exist: ' + orderid;
      throw new Error(JSON.stringify(jsonResp));
    }

    let order = {};
    try {
      order = JSON.parse(orderAsbytes.toString());                     //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + orderid;
      throw new Error(jsonResp);
    }
    console.info(order);
    order.status = status;                                            //change the status
    order.statusCode = (parseInt(order.statusCode) + 1).toString()    // change the status Code

    let orderJSONasBytes = Buffer.from(JSON.stringify(order));
    await stub.putState(orderid, orderJSONasBytes);                   //rewrite the order

    console.info('- end update status (success)');
  }

  // ===============================================
  // updateLogisticDetails - update the details of Logistic of an order
  // ===============================================
  async updateLogisticDetails(stub, args, thisClass) {

    if (args.length != 6) {
      throw new Error('Incorrect number of arguments. Expecting 6 arguments');
    }

    let orderid = args[0],
        logisticId = args[1],
        location = args[2],
        status = args[3],
        timestamp = args[4],
        temperature = args[5];

    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3nd argument must be a non-empty string');
    }
    if (args[3].length <= 0) {
      throw new Error('4th argument must be a non-empty string');
    }
    if (args[4].length <= 0) {
      throw new Error('5th argument must be a non-empty string');
    }
    if (args[5].length <= 0) {
      throw new Error('6th argument must be a non-empty string');
    }

    let orderAsbytes = await stub.getState(orderid);                     //get the order from chaincode state
    if (!orderAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Order does not exist: ' + orderid;
      throw new Error(JSON.stringify(jsonResp));
    }

    let order = {};
    try {
      order = JSON.parse(orderAsbytes.toString());                       //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + orderid;
      throw new Error(jsonResp);
    }
    console.info(order);
    
    let tr = {},
        timeRaster = [];
          
    tr.timestamp = timestamp                                            
    tr.temperature = temperature
    timeRaster.push(tr)

    order.logistic.logisticId = logisticId                              // change the Logistic Id
    order.logistic.location = location                                  // change the location
    order.status = status                                               // change the status
    order.statusCode = (parseInt(order.statusCode) + 1).toString()      // change the status Code
    order.timeRaster = timeRaster                                       // updating the timeRaster

    let orderJSONasBytes = Buffer.from(JSON.stringify(order));
    await stub.putState(orderid, orderJSONasBytes);                     //rewrite the order

    console.info('- end update logistic details (success)');
  }

  // ===============================================
  // updateTimeRaster - update the time raster of an order
  // ===============================================
  async updateTimeRaster(stub, args, thisClass) {

    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3 arguments');
    }

    let orderid = args[0],
        timestamp = args[1],
        temperature = args[2];

    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3nd argument must be a non-empty string');
    }

    let orderAsbytes = await stub.getState(orderid);                     //get the order from chaincode state
    if (!orderAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Order does not exist: ' + orderid;
      throw new Error(JSON.stringify(jsonResp));
    }

    let order = {};
    try {
      order = JSON.parse(orderAsbytes.toString());                      //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + orderid;
      throw new Error(jsonResp);
    }
    console.info(order);

    let timeRas = {}
    timeRas.timestamp = timestamp
    timeRas.temperature = temperature

    order.timeRaster.push(timeRas);                                      // update the time Raster

    let timeRaster = order.timeRaster,
        size = timeRaster.length;

    if (size >= 4) {
        let tr1 = Date.parse(timeRaster[size - 1].timestamp),
            tr4 = Date.parse(timeRaster[size - 4].timestamp),
            temp1 = parseInt(timeRaster[size - 1].temperature),
            temp2 = parseInt(timeRaster[size - 2].temperature),
            temp3 = parseInt(timeRaster[size - 3].temperature);

        let diff = Math.abs(tr1 - tr4) / 1000,
            diffInMintues = Math.floor(diff / 60);
        
        if ((diffInMintues >= 30) && ((temp1 + temp2 + temp3) / 3) > 20) {    // checking the Temperature Breach
            order.tempBreach = "Yes";
        }
    }

    let orderJSONasBytes = Buffer.from(JSON.stringify(order));
    await stub.putState(orderid, orderJSONasBytes);                           //rewrite the order

    console.info('- end update Time Raster (success)');
  }

  // ===============================================
  // readOrder - read a order from chaincode state
  // ===============================================
  async readOrder(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting orderid of the order to query');
    }

    let orderId = args[0];
    if (!orderId) {
      throw new Error(' order Id must not be empty');
    }
    let orderAsbytes = await stub.getState(orderId);                         //get the order from chaincode state
    if (!orderAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Order does not exist: ' + orderId;
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(orderAsbytes.toString());
    console.info('=======================================');
    return orderAsbytes;
  }

  // ===============================================
  // queryOrders - read all order from chaincode state
  // ===============================================
  async queryOrders(stub, args, thisClass) {
    //   0
    // 'queryString'
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting queryString');
    }
    let queryString = args[0];
    if (!queryString) {
      throw new Error('queryString must not be empty');
    }
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, queryString, thisClass);
    return queryResults;
  }

  async getAllResults(iterator, isHistory) {
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }

  // =========================================================================================
  // getQueryResultForQueryString executes the passed in query string.
  // Result set is built and returned as a byte array containing the JSON results.
  // =========================================================================================
  async getQueryResultForQueryString(stub, queryString, thisClass) {

    console.info('- getQueryResultForQueryString queryString:\n' + queryString)
    let resultsIterator = await stub.getQueryResult(queryString);
    let method = thisClass['getAllResults'];

    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

};

shim.start(new supplyChainTrackingChaincode());
