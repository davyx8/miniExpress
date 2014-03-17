var miniHttp = require('./miniHttp');
var fs = require('fs');
var path =require('path');
var qs=require('querystring');


var parser=require('./parser').parseReq;
var app;
var queue=[];


//put the function and the resource together
function team(resource,func,method){
    return {
        resource:resource,
        func:func,
        method:method
    }
}

// checks if type of req is actually that of type
isfunction=function(type,req){
    console.log(type);
    if(type.indexOf('/')==-1){
        return (req.contentType.substring(req.contentType.indexOf('/')+1,req.contentType.length)==type);
    }
    else{
        console.log("asdf")
        var sort=type.substring(0,type.indexOf('/'))
        var specType=type.substring(type.indexOf('/')+1,type.length);
        if (sort==req.contentType.substring(0,req.contentType.indexOf('/'))){
            if (specType=='*')
                return true;
            else if(specType==req.contentType.substring(req.contentType.indexOf('/')+1,
                req.contentType.length))
                return true;
        }
    }
    return false;
}
//init the objects of req res
var miniExpress= function(){
    var res={response:''};
    var req={request:""};

    req.param=function(str){

        return req.params.str;
    }


    res.get=function(str){
        return this.response.getHeader(str);
    }

    res.status = function(code) {
        this.statusCode=code;
        this.response.statusCode=code;
    }



    res.set = function(field, value) {
        if (value) {
            this.response.setHeader(field,value);

        }
        else {
            var objects = field.split(',');
            for(var i in objects){
                var curr = objects[i].split(':');
                this.response.headers[curr[0]] = curr[1]
            }
        }
    }
    res.json = function(status, body){
        if (body==undefined) {
            if (typeof status === 'number') {
                res.send(status);
                return;
            }

            else {

                res.response.statusCode='200';
                res.send('200');
                body=status;
            }
        }

        else{
            res.response.write(JSON.stringify(body));
            res.response.write(JSON.stringify(status));
            return;
        }
        if (!res.get('Content-Length')) {
            var a=JSON.stringify(body);
            res.set('Content-Length', a.length);
        }
        if (!res.get('Content-Type')) {
            res.set('Content-Type', 'application/json');
        }
        res.response.write(JSON.stringify(body));
    }
    res.send = function(status, body) {
        if (!body) {
            if (typeof status === 'number') {
                res.set('Content-Length', statusType2[status].length);
                res.set('Content-Type', 'text/plain');
                res.response.statusCode=status;
                res.response.write(statusType2[status]);
            }
            else {
                body = status;
                status = 200;
            }
        }
        if (typeof body === 'object') {
            res.json(status, body);
        }
        if (typeof body === 'string') {
            if (!res.get('Content-Length')) {
                res.set('Content-Length', body.length);
            }
            if (!res.get('Content-Type')) {
                res.set('Content-Type', 'text/plain');
            }
            res.status(status);
            res.body = body;
            res.response.write(body);
        }
        res.response.end();
    }





    app=function (request,response){
        res.response=response;
        req.request=request;
        req.body=req.request.body;
        req.params={};
        req.query={};
        req.host=request.headers["Host"].split(":")[0];
        req.protocol="http";
        req.request.params={};

        response.setTimeout(2000,function(){
                console.log("its all over");
                response.end()
            }
        );


        var found=false;
        var nextIterator=0;
        next();
        function next(){
            if(nextIterator<queue.length){
                var item=queue[nextIterator];

                req.contentType=req.request.headers["Content-Type"];
                req.is =function(type){
                    return isfunction(type,req);
                }
                req.params.regex=new RegExp(item.resource);
                parameters(item.resource,req);
                req.request.params=req.params;
                if(req.params.regex.test(req.request.url)){
                    req.path =req.request.url.substring(0,req.request.url.indexOf("?"));
                    req.queryhelp=req.request.url.substring(req.request.url.indexOf("?")+1,req.request.url.length).split("&");
                    for(var i in req.queryhelp){
                        req.queryhelp[i]=req.queryhelp[i].split("=");
                        var atribute=req.queryhelp[i][0];
                        req.query[atribute]=req.queryhelp[i][1];
                    }


                    response.setHeader('Content-Type',req.contentType);
                    found=true;
                    nextIterator++;
                    if(item.method===req.request.method.toLowerCase() ||item.method==undefined){
                        item.func(req,res,next);
                    }
                    next();
                }
                else{
                    nextIterator++;
                    next()
                }
            }
        }
        if(!found){

            res.body="FILE NOT FOUND!";
            res.response.setHeader('Content-Length',res.response.body.length);
            res.response.statusCode="404";
            res.response.write(res.body);
        }
        res.response.setHeader["Connection"]=req.request.headers["Connection"];
        res.response.version=req.request.httpVersion;
        if(res.keepAlive)
            res.conect="keep-alive";
        else
            res.conect ="close";

    }

    app.use= function(resource,func){
        if(!(arguments.length<2)){
            queue.push(team(resource,func));
        }
        else
        {
            func=arguments[0];
            resource="/";
            queue.push(team(resource,func));
        }
    }

    app.listen = function(port){
        var res = miniHttp.createServer(app);
        return res.listen(port);
    }
    app.get= function(resource,func){
        queue.push(team(resource,func,"get"));

    }
    app.post = function(resource,func){
        queue.push(team(resource,func,"post"));
    }
    app.delete = function(resource,func){
        queue.push(team(resource,func,"delete"));
    }
    app.put = function(resource,func){
        queue.push(team(resource,func,"put"));
    }
    return app;
}

miniExpress.listen = function(port){
    var res = miniHttp.createServer(app);
    return res.listen(port);
}

miniExpress.close=function() {
    miniHttp.close();
}

miniExpress.static=function(rootFolder){
    return function(req,res,next){

        completepath=path.join(rootFolder,req.path);
        fs.readFile(completepath,'utf8', function(err,data){
            if (!err){
                res.response.statusCode="200";
                res.body = data;
                res.response.setHeader('Content-Length',data.length);
                res.response.write(res.body);
            }
            else{ // update res
                res.response.body="file not found or broken";
                res.response.setHeader('Content-Length',res.response.body.length);
                res.response.write(res.response.body);
            }
        });
    }
}

miniExpress.json = function() {
    return function(req, res, next) {
        var index = req.request.headers['Content-Type'].indexOf('application/json');
        if (index == -1 ){
            index = req.request.headers['Content-Type'].indexOf('application/x-www-form-urlencoded');

            if (index == -1 ){
                return next();
            }
            req.flag=false;
            return miniExpress.urlencoded()(req, res, next);
        }
        req.request.body = JSON.parse(req.body);
        req.body=req.request.body;
        if(!req.flag)
            next();
    }
}

miniExpress.urlencoded=function(){
    return function(req, res, next) {
        var index2 = req.request.headers['Content-Type'].indexOf('application/x-www-form-urlencoded');

        if ( index2 === -1 || req.flag) {
            if (req.bodyParse) {
                return miniExpress.json()(req, res, next);
            }
        }
        var query = req.body;
        req.body = {};
        var bodyArray = query.split("&");
        for(var i in bodyArray){
            var curr = bodyArray[i].split("=");
            req.body[curr[0]] = curr[1];
        }
        if(!req.flag)
            next();
    }
}
miniExpress.bodyParser=function(){
    return function(req, res, next) {
        req.flag=true;
        req.bodyParse = true;
        if (req.body) {

            miniExpress.urlencoded()(req, res, next);
        }
        else {

            next();
        }
    }
}


parameters=function(resource,req){
    route=resource;
    semicolon=route.indexOf(':');
    prefix=route.substring(0,semicolon-1);

    if(semicolon==-1) return;
    slash=route.indexOf('/',semicolon);
    suffix=route.substring(route.indexOf('/',semicolon),route.length);
    if(slash==-1){
        slash=route.length;
        suffix="";
    }
    newParam=route.substring(semicolon+1,slash);
    end=req.request.url.indexOf('/',semicolon);
    if (req.request.url.indexOf('/',semicolon)==-1) end=req.request.url.length;
    newValue=req.request.url.substring(semicolon,end);
    regex = new RegExp(prefix + "[/][A-Za-z0-9_]+" + suffix);


    req.params[newParam]=newValue;

    req.params.regex=regex;
};


miniExpress.cookieParser= function(/*value,request*/){
    return function(req,res,next){
        req.cookies={};
        var cookies = req.request.headers["Cookie"].split(';');
        var  split, cookie;
        for (var i in cookies) {
            cookie = {};
            split1 = cookies[i].split('=');
            res.send(500);
            req.cookies[split1[0]]=split1[1];


        }
        console.log(req.cookies)
        next();
    }
}
exports=module.exports=miniExpress;

dataType = {
    'txt': "text/plain",
    'html' : "text/html",
    'css' : "text/css",
    'js' : "application/javascript",
    'jpg' : "image/jpeg",
    'gif' : "image/gif"
};

statusType={
    'FILENOTFOUND':"404",
    'OK':"200",
    'NON-GET-REQUEST':"405",
    'NONFREAKINGPARSABLE':"500"
};
statusType2={
    "404":'FILENOTFOUND',
    "200":'OK',
    "405":'NON-GET-REQUEST',
    "500":'NONFREAKINGPARSABLE'
};/**
 * Created by root on 3/5/14.
 */
