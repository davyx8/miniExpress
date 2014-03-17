var net = require('net');
var fs = require('fs');
var path =require('path');
var events= require('events');
var parser = require('./parser').parseReq;
var Server;
var wait=false;
var messageOnHold;

/**
 * @param socket:the tcp socket of this response
 * @constructor:for response object that passed as a second listener to the request
 */
function ServerResponse(socket){
    this.socket=socket;
    this.headers={};
    this.headerDone=false;
}
    /**
     * @param statusCode-the number that represents the status of the response
     * @param codeExp
     * @param headers
     */
ServerResponse.prototype.writeHead=function(statusCode,codeExp,headers){
    if(codeExp == undefined)
        codeExp='';
    console.log(statusCode+"status")
    this.socket.write("HTTP/1.1"+" "+statusCode/*+codeExp*/);

    for (var header in headers){
        this.socket.write("\r\n"+header+": "+headers[header]);
        console.log(header+": "+headers[header]+"header")
    }
    this.socket.write("\r\n\r\n");
    this.headerDone=true;
    }

ServerResponse.prototype.setHeader=function(name, value){
        name=capitaliseFirstLetter(name);
        this.headers[name]=value;
    }

ServerResponse.prototype.getHeader=function(name){
    name=name.toLocaleLowerCase();
    name=capitaliseFirstLetter(name);
    return this.headers[name];
}


ServerResponse.prototype.write= function (data){
        if(!(this.headerDone)){//if the writeHead function was called before or not
           
            this.writeHead(this.statusCode,"",this.headers);
        }
        console.log(data+"data");
        this.socket.write(data);
    }
ServerResponse.prototype.end=function(){
        this.socket.end();
    }

ServerResponse.prototype.setTimeout=function(time){
        this.socket.setTimeout(function (){
            socket.close();
            socket.destroy();
        }, time);

}

/**
 * An IncomingMessage object is created by http.Server or http.ClientRequest and passed as the first argument to the 'request' and 'response' event respectively. It may be used to access response status, headers and data.

 It implements the Readable Stream interface, as well as the following additional events, methods, and properties.
 */
function IncomingMessage(socket){
    this.socket=socket;
    this.httpVersion="1.1";
    this.headers={};
    this.isHead=true;
    this.bodyExist=false;
    this.body="";
    this.first=true;
    this.setTimeout=function(msecs, callback){
    }
}
function capitaliseFirstLetter(string)
{
    string.toLowerCase();
   var rgx=/\b([^-]+)-(.+)\b/;
    var match=rgx.exec(string);
    if(match!=null){
        return  match[1].charAt(0).toUpperCase()+match[1].slice(1)+"-"+match[2].charAt(0).toUpperCase()+match[2].slice(1);
    }
    else{
       return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

/**
 *
 */
var miniHttp=function(){

}

exports=module.exports=miniHttp;


function headParse(data,message,response){
    try{
       var toSend =parser(data,message);
    }

    catch(err){
        console.log(err.toString());
    }

    message.isHead=false;//need to check that

    if(toSend){
        wait=false;
        miniHttp.Server.emit('request',message,response);
    }
    else{
        wait=true;
        messageOnHold=message;
    }
}

miniHttp.createServer=function(app){
    miniHttp.Server=new events.EventEmitter();

    miniHttp.Server.listen=function(port){
        netServer.listen(port);
    }
    miniHttp.Server.close=function(){
        netServer.close();
    }
    miniHttp.Server.on('request',function(request,response){

        if(request.url!=undefined){
            app(request,response);
        }
        else{
            console.log("o.o a bug")
        }
    });

    var netServer = net.createServer(function(socket){

        socket.on('data',function(data){
            var message=new IncomingMessage(socket);
            var response=new ServerResponse(socket);
            if(wait)
                message = messageOnHold;
            headParse(data,message,response);

        });
    });
    return netServer;
}


