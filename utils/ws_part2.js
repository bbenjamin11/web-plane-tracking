/*eslint-env node */
// ==================================
// Part 2 - incoming messages, look for type
// ==================================
var ibc = {};
var chaincode = {};
var async = require("async");

module.exports.setup = function(sdk, cc){
	ibc = sdk;
	chaincode = cc;
};

module.exports.process_msg = function(ws, data, owner){
	
	if(data.type == "chainstats"){
		console.log("Chainstats msg");
		ibc.chain_stats(cb_chainstats);
	}
	else if(data.type == "createBatch"){
		console.log("Create Batch ", data, owner);
		if(data.batch){
			chaincode.invoke.createBatch([data.batch.id,data.batch.bType, owner, data.batch.quantity, data.batch.vDate, data.batch.location], cb_invoked_createbatch);				//create a new paper
		}
	}
	else if(data.type == "getBatch"){
		console.log("Get Batch", data.batchId);
		chaincode.query.getBatch([data.batchId], cb_got_batch);
	}
	else if(data.type == "getAllBatches"){
		console.log("Get All Batches", owner);
		chaincode.query.getAllBatches([owner], cb_got_allbatches);
	}
	
	function cb_got_batch(e, batch){
		if(e != null){
			console.log("Get Batch error", e);
		}
		else{
			sendMsg({msg: "batch", batch: JSON.parse(batch)});
		}
	}
	
	function cb_got_allbatches(e, allBatches){
		if(e != null){
			console.log("Get All Batches error", e);
		}
		else{
			sendMsg({msg: "allBatches", batches: JSON.parse(allBatches).batches});
		}
	}
	
	function cb_invoked_createbatch(e, a){
		console.log("response: ", e, a);
		if(e != null){
			console.log("Invoked create batch error", e);
		}
		else{
			console.log("batch ID #" + data.batch.id)
			sendMsg({msg: "batchCreated", batchId: data.batch.id});
		}
		

	}
	
	//call back for getting the blockchain stats, lets get the block height now
	var chain_stats = {};
	function cb_chainstats(e, stats){
		chain_stats = stats;
		if(stats && stats.height){
			var list = [];
			for(var i = stats.height - 1; i >= 1; i--){										//create a list of heights we need
				list.push(i);
				if(list.length >= 8) break;
			}
			list.reverse();																//flip it so order is correct in UI
			console.log(list);
			async.eachLimit(list, 1, function(key, cb) {								//iter through each one, and send it
				ibc.block_stats(key, function(e, stats){
					if(e == null){
						stats.height = key;
						sendMsg({msg: "chainstats", e: e, chainstats: chain_stats, blockstats: stats});
					}
					cb(null);
				});
			}, function() {
			});
		}
	}

	//call back for getting a block's stats, lets send the chain/block stats
	function cb_blockstats(e, stats){
		if(chain_stats.height) stats.height = chain_stats.height - 1;
		sendMsg({msg: "chainstats", e: e, chainstats: chain_stats, blockstats: stats});
	}
	

	//send a message, socket might be closed...
	function sendMsg(json){
		if(ws){
			try{
				ws.send(JSON.stringify(json));
			}
			catch(e){
				console.log("error ws", e);
			}
		}
	}
};
