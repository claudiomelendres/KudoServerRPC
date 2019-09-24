#!/usr/bin/env node
const request = require('request');

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'rpc_queue';

        channel.assertQueue(queue, {
            durable: false
        });
        channel.prefetch(1);
        console.log(' [*] Esperando solicitudes');
        channel.consume(queue, function reply(msg) {
            //var n = parseInt(msg.content.toString());
            var n = msg.content.toString();
            console.log("------------content"); 
            console.log(n);
            //console.log(" [.] fib(%d)", n);
            let commandKey = n.split(':')[0];
            let commandValue = n.split(':')[1];

            if(commandKey == "GET_KUDOS")
            {
                var r = GetKudos(commandValue).then(r => {
                    console.log("------------r");                
                    console.log(r);
                    
                    channel.sendToQueue(msg.properties.replyTo,
                        Buffer.from(JSON.stringify(r).toString()), {
                            correlationId: msg.properties.correlationId
                        });
        
                    channel.ack(msg);
                })
            }

            if(commandKey == "DEL_KUDOS")
            {
                console.log(commandValue);
                GetKudos(commandValue).then(result => {
                    let result1 = JSON.stringify(result);
                    //let result2 = JSON.parse(result);
                    console.log(`myResults: ${result1}`);
                    DelKudos(result).then(r => {
                        console.log("------------r");                
                        console.log(r);
                        
                        channel.sendToQueue(msg.properties.replyTo,
                            Buffer.from(JSON.stringify(r).toString()), {
                                correlationId: msg.properties.correlationId
                            });
            
                        channel.ack(msg);
                    })
                })


            }


            if(commandKey == "UPDATE_USER")
            {
                getUserByNickname(commandValue).then(u => {
                    console.log("------------user");                
                    console.log(u.id);
                    let KudosTotal = n.split(':')[2];
                    UpdateUser(u.id,KudosTotal).then(r => {
                        // console.log("------------r");                
                        // console.log(r);
                        
                        channel.sendToQueue(msg.properties.replyTo,
                            Buffer.from(JSON.stringify(r).toString()), {
                                correlationId: msg.properties.correlationId
                            });
            
                        channel.ack(msg);
                    })
                })


            }


            




          
        });
    });
});

async function GetKudos(idDestino) {
    return new Promise(resolve => {
        const options = {
            url: 'http://localhost:5001/kudo/keys',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
                'User-Agent': 'my-reddit-client'
            },
            json: true,
            body: {
                destino:idDestino
            }
        };
        request(options, (err, res, body) => {
        if (err) { return console.log(err); }
      //   console.log(body.url);
         console.log('========== GetKudos()');
         console.log(body);
        resolve(body);
      });

    })
}


async function DelKudos(keys) {
    return new Promise(resolve => {
        const options = {
            url: 'http://localhost:5001/kudo',
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
            body: 
                //destino:idDestino
                // keys:[
                //     "88cb2e80-190d-44be-baed-d18a3897cd5f:cayo:kudo:mary",
                //     "f97a85bf-f9c3-402c-adad-cb1a08844b02:mary:kudo:javi30"
                // ]
                keys
            
        };
        request(options, (err, res, body) => {
        if (err) { return console.log(err); }
      //   console.log(body.url);
         //console.log(body);
        resolve(body);
      });

    })
}

// -------------------------------------------------------------- UPDATE_USER
async function UpdateUser(id, total) {
    // let id = '5d88125e34d510237606751b';
    // console.log('lllllllllllllllllllllllll');
    console.log(total);
    total = parseInt(total) + 1;
    return new Promise(resolve => {
        const options = {
            url: `http://localhost:5000/usuario/${id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
            body: 
            {
                kudosQty:total
                // keys:[
                //     "88cb2e80-190d-44be-baed-d18a3897cd5f:cayo:kudo:mary",
                //     "f97a85bf-f9c3-402c-adad-cb1a08844b02:mary:kudo:javi30"
                // ]
            }  
            
        };
        request(options, (err, res, body) => {
        if (err) { return console.log(err); }
      //   console.log(body.url);
         //console.log(body);
        resolve(body);
      });
    })
}


// -------------------------------------------------------------- UPDATE_USER
async function getUserByNickname(nickname) {
    return new Promise(resolve => {
        const options = {
            url: 'http://localhost:5000/usuario/nick',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
            body: 
            {
                nickname: nickname
            }  
            
        };
        request(options, (err, res, body) => {
        if (err) { return console.log(err); }
      //   console.log(body.url);
         //console.log(body);
        resolve(body);
      });
    })
}