const SerialPort = require('serialport')
const axios = require('axios')
const readline = require('readline');
const serialPortReadline = SerialPort.parsers.Readline;
const JSONdb = require('simple-json-db');
const db = new JSONdb('./database104.json');
const uuidv1 = require('uuid/v1');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//const inCseurl = "http://195.87.214.38:32820";
const inCseurl = "http://localhost:54265";

var aename = uuidv1() + "";
var aeResourceId = db.get("aeResourceId");
var comPortNumber = "";
var containers = {};

if(db.get("containers")){
    containers = db.get("containers");
}else{
    db.set("containers", {});
}

var comPortNumber = "COM4";

initializeSerialPort();

function initializeSerialPort() {
    const port = new SerialPort(comPortNumber, {
        baudRate: 115200,
        buffersize: 1024,
    });
    
    const parser = new serialPortReadline("\r\n");

    port.pipe(parser);

    parser.on('data', function (data) {
        var sensor = JSON.parse(data.toString('utf8')).sensor;
        if(aeResourceId){
            createContentInstance(sensor.identifier, sensor.val);
        }
    });
}

if(!aeResourceId){

    createIPE(function(error, response){
        console.log("Creating IPE...");
        if(!error){
            //createNode(function(error, response){
                // console.log("Creating Node...");
                // if(!error){
                    createDistanceContainer(function(error, response){
                        console.log("Creating Distance Container...");
                        if(!error){
                            createTemparatureContainer(function(error, response){
                                console.log("Creating Temparature Container...");
                                if(!error){
                                    createHuminityContainer(function(error, response){
                                        console.log("Creating Humidity Container...");
                                        if(!error){
                                            createLedContainer(function(error, response){
                                                console.log("Creating Led Container...");
                                                if(!error){
                                                    
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                //}
            //});
        }
    });
    
}

function createContentInstance(containerid, data){
    var d = {
        "m2m:cin": {
            "con": data
        }
    };

    console.log(containerid + " => " + data);
    
    axios.post(inCseurl + '/api/v1/onem2m/~' + containers[containerid], d, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI0",
            'X-M2M-Origin' : "Cipe",
            'Content-Type' : 'application/json;ty=4'
        }
    })
    .then((res) => {
        console.log(res.data.content["m2m:cin"].con);
    })
    .catch((error) => {
        console.error(error)
    })
}


function createIPE(callback){
    var data = {
        "m2m:ae" : {
            "rn": "adn-" + aename,
            "api": "0.2.481.2.0001.001"  + aename,
            "rr": true,
            "poa": ["http://192.168.1.152:32797"],
            "SupportedReleaseVersions":["1"]
        }
    };

    axios.post(inCseurl + '/api/v1/onem2m/~/in-cse', data, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI0",
            'X-M2M-Origin' : "Cve"  + aename,
            'Content-Type' : 'application/json;ty=2'
        }
    })
    .then((res) => {
        aeResourceId = res.data.content["m2m:ae"].resourceID;

        db.set('aeResourceId', aeResourceId);

        callback(null, res);

    })
    .catch((error) => {
        console.error(error)

        callback(error);
    });
}

function createNode(callback){
    var data = {
        "m2m:nod": {
          "rn": "nod-justin",
          "ni": "node-0.2.481.1.12345"
        }
    }

    axios.post(inCseurl + '/api/v1/onem2m/~/in-cse', data, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI1",
            'X-M2M-Origin' : "Sorigin",
            'Content-Type' : 'application/json;ty=14'
        }
    })
    .then((res) => {

        callback(null, res);

    })
    .catch((error) => {
        console.error(error)

        callback(error);
    });
 
}

function createDistanceContainer(callback){
    var data = {
        "m2m:cnt": {
          "rn": "distance"
        }
    }

    axios.post(inCseurl + '/api/v1/onem2m/~' + aeResourceId, data, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI3",
            'X-M2M-Origin' : "Sorigin",
            'Content-Type' : 'application/json;ty=3'
        }
    })
    .then((res) => {

        containers["distance"] = res.data.content["m2m:cnt"].resourceID

        db.set('containers', containers);

        callback(null, res);

    })
    .catch((error) => {
        console.error(error)

        callback(error);
    });
}

function createTemparatureContainer(callback){
    var data = {
        "m2m:cnt": {
          "rn": "temperature"
        }
    }
    
    axios.post(inCseurl + '/api/v1/onem2m/~' + aeResourceId, data, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI4",
            'X-M2M-Origin' : "Sorigin",
            'Content-Type' : 'application/json;ty=3'
        }
    })
    .then((res) => {

        containers["temperature"] = res.data.content["m2m:cnt"].resourceID
        db.set('containers', containers);
        callback(null, res);

    })
    .catch((error) => {
        console.error(error)

        callback(error);
    });

}

function createHuminityContainer(callback){
    var data = {
        "m2m:cnt": {
          "rn": "humidity"
        }
    }

    axios.post(inCseurl + '/api/v1/onem2m/~' + aeResourceId, data, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI5",
            'X-M2M-Origin' : "Sorigin",
            'Content-Type' : 'application/json;ty=3'
        }
    })
    .then((res) => {

        containers["humidity"] = res.data.content["m2m:cnt"].resourceID
        db.set('containers', containers);
        callback(null, res);

    })
    .catch((error) => {
        console.error(error)

        callback(error);
    });

}

function createLedContainer(callback){
    var data = {
        "m2m:cnt": {
            "rn" : "lamp"
        }
    }

    axios.post(inCseurl + '/api/v1/onem2m/~' + aeResourceId, data, {
        headers: {
            'User-Agent' : 'ipe',
            'X-M2M-RI' : "RI6",
            'X-M2M-Origin' : "Sorigin",
            'Content-Type' : 'application/json;ty=3'
        }
    })
    .then((res) => {
        containers["lamp"] = res.data.content["m2m:cnt"].resourceID
        db.set('containers', containers);
        callback(null, res);

    })
    .catch((error) => {
        console.error(error)

        callback(error);
    });
};
