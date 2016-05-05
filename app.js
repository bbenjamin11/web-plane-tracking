"use strict";
/* global process */
/* global __dirname */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
/////////////////////////////////////////
///////////// Setup Node.js /////////////
/////////////////////////////////////////
var express = require('express');

var session = require('express-session');
var compression = require('compression');
var serve_static = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();
var url = require('url');
var async = require('async');
var setup = require('./setup');
var cors = require("cors");
var fs = require("fs");
var parseCookie =cookieParser('Somethignsomething1234!test');
var sessionStore = new session.MemoryStore();

//// Set Server Parameters ////
var host = setup.SERVER.HOST;
var port = setup.SERVER.PORT;

////////  Pathing and Module Setup  ////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('.html', require('jade').__express);
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); 
app.use(parseCookie);
app.use('/cc/summary', serve_static(path.join(__dirname, 'cc_summaries')) );												//for chaincode investigator
app.use( serve_static(path.join(__dirname, 'public'), {maxAge: '1d', setHeaders: setCustomCC}) );							//1 day cache
//app.use( serve_static(path.join(__dirname, 'public')) );
app.use(session({secret:'Somethignsomething1234!test', resave:true, saveUninitialized:true, store: sessionStore}));

function setCustomCC(res, path) {
	if (serve_static.mime.lookup(path) === 'image/jpeg')  res.setHeader('Cache-Control', 'public, max-age=2592000');		//30 days cache
	else if (serve_static.mime.lookup(path) === 'image/png') res.setHeader('Cache-Control', 'public, max-age=2592000');
	else if (serve_static.mime.lookup(path) === 'image/x-icon') res.setHeader('Cache-Control', 'public, max-age=2592000');
}
// Enable CORS preflight across the board.
app.options('*', cors());
app.use(cors());

//// Router ////
var router = require('./routes/site_router');
app.use('/', router);

///////////  Configure Webserver  ///////////
app.use(function(req, res, next){
	var keys;
	console.log('------------------------------------------ incoming request ------------------------------------------');
	console.log('New ' + req.method + ' request for', req.url);
	req.bag = {};											//create my object for my stuff
	req.session.count = eval(req.session.count) + 1;
	req.bag.session = req.session;
	
	var url_parts = url.parse(req.url, true);
	req.parameters = url_parts.query;
	keys = Object.keys(req.parameters);
	if(req.parameters && keys.length > 0) console.log({parameters: req.parameters});		//print request parameters
	keys = Object.keys(req.body);
	if (req.body && keys.length > 0) console.log({body: req.body});						//print request body
	next();
});

////////////////////////////////////////////
////////////// Error Handling //////////////
////////////////////////////////////////////
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
app.use(function(err, req, res, next) {		// = development error handler, print stack trace
	console.log("Error Handeler -", req.url);
	var errorCode = err.status || 500;
	res.status(errorCode);
	req.bag.error = {msg:err.stack, status:errorCode};
	if(req.bag.error.status == 404) req.bag.error.msg = "Sorry, I cannot locate that file";
	res.render('template/error', {bag:req.bag});
});

// ============================================================================================================================
// 														Launch Webserver
// ============================================================================================================================
var server = http.createServer(app).listen(port, function() {});
//var server = http.createServer(app).listen(port, '192.168.1.2');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'production';
server.timeout = 240000;																							// Ta-da.
console.log('------------------------------------------ Server Up - ' + host + ':' + port + ' ------------------------------------------');
if(process.env.PRODUCTION) console.log('Running using Production settings');
else console.log('Running using Developer settings');


// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================
// ============================================================================================================================

// ============================================================================================================================
// 														Warning
// ============================================================================================================================

// ============================================================================================================================
// 														Entering
// ============================================================================================================================

// ============================================================================================================================
// 														Test Area
// ============================================================================================================================
var part2 = require('./utils/ws_part2');
var ws = require('ws');
var wss = {};
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
var manual = {
  "credentials": {
    "peers": [
      {
        "discovery_host": "479b7100-eed7-464b-b5c8-53158b675bf0_vp1-discovery.blockchain.ibm.com",
        "discovery_port": 30303,
        "api_host": "479b7100-eed7-464b-b5c8-53158b675bf0_vp1-api.blockchain.ibm.com",
        "api_port_tls": 443,
        "api_port": 80,
        "type": "peer",
        "network_id": "479b7100-eed7-464b-b5c8-53158b675bf0",
        "container_id": "46a2b68fdaa13a13aaa8895f3fa7923609d7ee2dbb07494f3b23736167ae524d",
        "id": "479b7100-eed7-464b-b5c8-53158b675bf0_vp1",
        "api_url": "http://479b7100-eed7-464b-b5c8-53158b675bf0_vp1-api.blockchain.ibm.com:80"
      },
      {
        "discovery_host": "479b7100-eed7-464b-b5c8-53158b675bf0_vp2-discovery.blockchain.ibm.com",
        "discovery_port": 30303,
        "api_host": "479b7100-eed7-464b-b5c8-53158b675bf0_vp2-api.blockchain.ibm.com",
        "api_port_tls": 443,
        "api_port": 80,
        "type": "peer",
        "network_id": "479b7100-eed7-464b-b5c8-53158b675bf0",
        "container_id": "04df5e24876a325f2fb2191757c63d4208c4236a8a43713bb2c5c3052f718749",
        "id": "479b7100-eed7-464b-b5c8-53158b675bf0_vp2",
        "api_url": "http://479b7100-eed7-464b-b5c8-53158b675bf0_vp2-api.blockchain.ibm.com:80"
      }
    ],
    "ca": {
      "479b7100-eed7-464b-b5c8-53158b675bf0_ca": {
        "url": "479b7100-eed7-464b-b5c8-53158b675bf0_ca-api.blockchain.ibm.com:30303",
        "discovery_host": "479b7100-eed7-464b-b5c8-53158b675bf0_ca-discovery.blockchain.ibm.com",
        "discovery_port": 30303,
        "api_host": "479b7100-eed7-464b-b5c8-53158b675bf0_ca-api.blockchain.ibm.com",
        "api_port_tls": 30303,
        "api_port": 80,
        "type": "ca",
        "network_id": "479b7100-eed7-464b-b5c8-53158b675bf0",
        "container_id": "a57f24008dfbdd1a7a9f64ae9b0edf74dc7240546a980b52d3c3a26b9be93e14"
      }
    },
    "users": [
      {
        "username": "user_type1_b22d288bdf",
        "secret": "eb837073f6",
        "enrollId": "user_type1_b22d288bdf",
        "enrollSecret": "eb837073f6"
      },
      {
        "username": "user_type1_d147149220",
        "secret": "1be933cdd3",
        "enrollId": "user_type1_d147149220",
        "enrollSecret": "1be933cdd3"
      },
      {
        "username": "user_type1_075928fbed",
        "secret": "6715618c17",
        "enrollId": "user_type1_075928fbed",
        "enrollSecret": "6715618c17"
      },
      {
        "username": "user_type1_366a7031c1",
        "secret": "29f0682fff",
        "enrollId": "user_type1_366a7031c1",
        "enrollSecret": "29f0682fff"
      },
      {
        "username": "user_type1_3560d52c20",
        "secret": "810254dcba",
        "enrollId": "user_type1_3560d52c20",
        "enrollSecret": "810254dcba"
      },
      {
        "username": "user_type2_dfacf9c186",
        "secret": "db5305b76b",
        "enrollId": "user_type2_dfacf9c186",
        "enrollSecret": "db5305b76b"
      },
      {
        "username": "user_type2_7a03b3f738",
        "secret": "95bff8c7f7",
        "enrollId": "user_type2_7a03b3f738",
        "enrollSecret": "95bff8c7f7"
      },
      {
        "username": "user_type2_1ddb5d7a55",
        "secret": "75177237ee",
        "enrollId": "user_type2_1ddb5d7a55",
        "enrollSecret": "75177237ee"
      },
      {
        "username": "user_type2_f7df609241",
        "secret": "22ddc8a853",
        "enrollId": "user_type2_f7df609241",
        "enrollSecret": "22ddc8a853"
      },
      {
        "username": "user_type2_99216da3a2",
        "secret": "1cba095ae9",
        "enrollId": "user_type2_99216da3a2",
        "enrollSecret": "1cba095ae9"
      },
      {
        "username": "user_type4_4e88bcf210",
        "secret": "4010eafcf7",
        "enrollId": "user_type4_4e88bcf210",
        "enrollSecret": "4010eafcf7"
      },
      {
        "username": "user_type4_f4a5b7a9f4",
        "secret": "d0ed912207",
        "enrollId": "user_type4_f4a5b7a9f4",
        "enrollSecret": "d0ed912207"
      },
      {
        "username": "user_type4_02ce5426a6",
        "secret": "02800df527",
        "enrollId": "user_type4_02ce5426a6",
        "enrollSecret": "02800df527"
      },
      {
        "username": "user_type4_837854727b",
        "secret": "f0c277156c",
        "enrollId": "user_type4_837854727b",
        "enrollSecret": "f0c277156c"
      },
      {
        "username": "user_type4_43315aed4c",
        "secret": "e451005aee",
        "enrollId": "user_type4_43315aed4c",
        "enrollSecret": "e451005aee"
      },
      {
        "username": "user_type8_9e80ce005f",
        "secret": "222becf4c8",
        "enrollId": "user_type8_9e80ce005f",
        "enrollSecret": "222becf4c8"
      },
      {
        "username": "user_type8_1c34ed7f19",
        "secret": "9c1b0be122",
        "enrollId": "user_type8_1c34ed7f19",
        "enrollSecret": "9c1b0be122"
      },
      {
        "username": "user_type8_40b5a33e77",
        "secret": "eb3cdd13d2",
        "enrollId": "user_type8_40b5a33e77",
        "enrollSecret": "eb3cdd13d2"
      },
      {
        "username": "user_type8_55355c96fb",
        "secret": "078d626663",
        "enrollId": "user_type8_55355c96fb",
        "enrollSecret": "078d626663"
      },
      {
        "username": "user_type8_037ccc7540",
        "secret": "06f05452ac",
        "enrollId": "user_type8_037ccc7540",
        "enrollSecret": "06f05452ac"
      }
    ]
  }
};

   // "credentials": {
   //          "peers": [
   //             {
   //                "discovery_host": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp1-discovery.blockchain.ibm.com",
   //                "discovery_port": 30303,
   //                "api_host": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp1-api.blockchain.ibm.com",
   //                "api_port_tls": 443,
   //                "api_port": 80,
   //                "type": "peer",
   //                "network_id": "14fe0a14-6eee-4265-b13a-3f5fd90ee042",
   //                "container_id": "4355981b2c00983f1c31c06637a1793756dbbbfd976e8f055675b4a6857ea079",
   //                "id": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp1",
   //                "api_url": "http://14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp1-api.blockchain.ibm.com:80"
   //             },
   //             {
   //                "discovery_host": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp2-discovery.blockchain.ibm.com",
   //                "discovery_port": 30303,
   //                "api_host": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp2-api.blockchain.ibm.com",
   //                "api_port_tls": 443,
   //                "api_port": 80,
   //                "type": "peer",
   //                "network_id": "14fe0a14-6eee-4265-b13a-3f5fd90ee042",
   //                "container_id": "8840ac79c76c1c54502d8c5ed092d30ec7b57d0c27f51b0e8cc9eac37539e11b",
   //                "id": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp2",
   //                "api_url": "http://14fe0a14-6eee-4265-b13a-3f5fd90ee042_vp2-api.blockchain.ibm.com:80"
   //             }
   //          ],
   //          "ca": {
   //             "14fe0a14-6eee-4265-b13a-3f5fd90ee042_ca": {
   //                "url": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_ca-api.blockchain.ibm.com:30303",
   //                "discovery_host": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_ca-discovery.blockchain.ibm.com",
   //                "discovery_port": 30303,
   //                "api_host": "14fe0a14-6eee-4265-b13a-3f5fd90ee042_ca-api.blockchain.ibm.com",
   //                "api_port_tls": 30303,
   //                "api_port": 80,
   //                "type": "ca",
   //                "network_id": "14fe0a14-6eee-4265-b13a-3f5fd90ee042",
   //                "container_id": "ede870d45c0c7021444959e95b360f3b8ffaa08b618bbc6394741e0f62574623"
   //             }
   //          },
   //          "users": [
   //             {
   //                "username": "user_type0_a9a6e4fce8",
   //                "secret": "9acbd394b9",
   //                "enrollId": "user_type0_a9a6e4fce8",
   //                "enrollSecret": "9acbd394b9"
   //             },
   //             {
   //                "username": "user_type0_11e97d8982",
   //                "secret": "559c18238a",
   //                "enrollId": "user_type0_11e97d8982",
   //                "enrollSecret": "559c18238a"
   //             },
   //             {
   //                "username": "user_type1_5e9fedbb86",
   //                "secret": "d7e27e48a3",
   //                "enrollId": "user_type1_5e9fedbb86",
   //                "enrollSecret": "d7e27e48a3"
   //             },
   //             {
   //                "username": "user_type1_00c2bfd982",
   //                "secret": "0334c98ac0",
   //                "enrollId": "user_type1_00c2bfd982",
   //                "enrollSecret": "0334c98ac0"
   //             },
   //             {
   //                "username": "user_type2_20d5a9ae46",
   //                "secret": "94f7d672ca",
   //                "enrollId": "user_type2_20d5a9ae46",
   //                "enrollSecret": "94f7d672ca"
   //             },
   //             {
   //                "username": "user_type2_0b1e993179",
   //                "secret": "70f28690f2",
   //                "enrollId": "user_type2_0b1e993179",
   //                "enrollSecret": "70f28690f2"
   //             },
   //             {
   //                "username": "user_type3_6cca4d128d",
   //                "secret": "d28d90c080",
   //                "enrollId": "user_type3_6cca4d128d",
   //                "enrollSecret": "d28d90c080"
   //             },
   //             {
   //                "username": "user_type3_327cdae88a",
   //                "secret": "55b5a844ce",
   //                "enrollId": "user_type3_327cdae88a",
   //                "enrollSecret": "55b5a844ce"
   //             },
   //             {
   //                "username": "user_type4_9e66b64b3a",
   //                "secret": "2c07c864f9",
   //                "enrollId": "user_type4_9e66b64b3a",
   //                "enrollSecret": "2c07c864f9"
   //             },
   //             {
   //                "username": "user_type4_2def2f1655",
   //                "secret": "0924a95968",
   //                "enrollId": "user_type4_2def2f1655",
   //                "enrollSecret": "0924a95968"
   //             }
   //          ]
   //       }
   //  };


var peers = manual.credentials.peers;
console.log('loading hardcoded peers');
var users = null;																		//users are only found if security is on
if(manual.credentials.users) users = manual.credentials.users;
console.log('loading hardcoded users');

if(process.env.VCAP_SERVICES){															//load from vcap, search for service, 1 of the 3 should be found...
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	for(var i in servicesObject){
		if(i.indexOf('ibm-blockchain') >= 0){											//looks close enough
			if(servicesObject[i][0].credentials.error){
				console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
				peers = null;
				users = null;
				process.error = {type: 'network', msg: "Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date."};
			}
			if(servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers){
				console.log('overwritting peers, loading from a vcap service: ', i);
				peers = servicesObject[i][0].credentials.peers;
				if(servicesObject[i][0].credentials.users){
					console.log('overwritting users, loading from a vcap service: ', i);
					users = servicesObject[i][0].credentials.users;
				} 
				else users = null;														//no security
				break;
			}
		}
	}
}


// ==================================
// configure ibm-blockchain-js sdk
// ==================================
var options = 	{
					network:{
						peers: peers,
						users: users,
                  options: {quiet: true, tls:false, maxRetry: 1}
					},
					chaincode:{
						zip_url: 'https://github.com/mcenatie/sc-chaincode/archive/master.zip',
						unzip_dir: 'sc-chaincode-master',									//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/mcenatie/sc-chaincode',			//GO git http url
					
						//hashed cc name from prev deployment
						//deployed_name: 'mycc'
						//deployed_name: '4f1bf6581ebe31326cf8ae669859225f1ef65ec6b718142f1e30a4dc9c9dbd51c3ddcc2ff070542c8c3d38e82d81c7690da5db7a0fbc3383874787816e2a4017'
					}
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.chaincode.deployed_name = "";
}
ibc.load(options, cb_ready);																//parse/load chaincode

var chaincode = null;
function cb_ready(err, cc){																	//response has chaincode functions
	if(err != null){
		console.log('! looks like an error loading the chaincode, app will fail\n', err);
		if(!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
	}
	else{
		chaincode = cc;
		part2.setup(ibc, cc);
		router.setup(ibc, cc);
		
		if(!cc.details.deployed_name || cc.details.deployed_name === ""){												//decide if i need to deploy
			cc.deploy('init', [], {save_path: './cc_summaries', delay_ms: 60000}, cb_deployed);
		}
		else{
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			cb_deployed();
		}
	}
}

app.use('/', router);
// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d){
	if(e != null){
		console.log('! looks like a deploy error, holding off on the starting the socket\n', e);
		if(!process.error) process.error = {type: 'deploy', msg: e.details};
	}
	else{
		console.log('------------------------------------------ Websocket Up ------------------------------------------');
		ibc.save('./cc_summaries');															//save it here for chaincode investigator
		wss = new ws.Server({server: server});												//start the websocket now
		wss.on('connection', function connection(ws) {
			ws.on('message', function incoming(message) {
				console.log('received ws msg:', message);
				var data = JSON.parse(message);
				var finInst = null
				parseCookie(ws.upgradeReq, null, function(err) {
			        var sessionID = ws.upgradeReq.signedCookies['connect.sid'];
			        sessionStore.get(sessionID, function(err, sess) {
				    	if(sess){
				    		part2.process_msg(ws, data, sess.username);
				    	}
				    });
			    }); 
			});
			
			ws.on('close', function(){});
		});
		
		wss.broadcast = function broadcast(data) {											//send to all connections
			wss.clients.forEach(function each(client) {
				try{
					data.v = '2';
					client.send(JSON.stringify(data));
				}
				catch(e){
					console.log('error broadcast ws', e);
				}
			});
		};
		
		// ========================================================
		// Part 2 Code - Monitor the height of the blockchain
		// =======================================================
		ibc.monitor_blockheight(function(chain_stats){										//there is a new block, lets refresh everything that has a state
			if(chain_stats && chain_stats.height){
				console.log('hey new block, lets refresh and broadcast to all');
				ibc.block_stats(chain_stats.height - 1, cb_blockstats);
				wss.broadcast({msg: 'reset'});
			}
			
			//got the block's stats, lets send the statistics
			function cb_blockstats(e, stats){
				if(chain_stats.height) stats.height = chain_stats.height - 1;
				wss.broadcast({msg: 'chainstats', e: e, chainstats: chain_stats, blockstats: stats});
			}
			

		});
	}
}
