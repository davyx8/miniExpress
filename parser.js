url = require('url');
var space=/\s/;
var  newLine=/\r\n/;
var  newParagraph=/\r\n\r\n/;
// this part of the code receives raw data and parses it to intelligible req, res objects

function parse(rawData,req) {
if(!req.isHead && req.bodyExist){
  req.body?req.body+=rawData:req.body=rawData.toString();
    return (bodyChecker(req));
}

if(req.first){
    req.headers={};
    var headAndBody=rawData.toString().split(newParagraph);
    var lines =headAndBody[0].toString().trim().split(newLine);
    if(headAndBody.length>1){
        req.body=headAndBody[1];
    }
        try{
            parseRequest(lines[0],req);
        }
        catch(err){
            req.headers["Content-Type"]="error";
            req.headers["Content-Length"]= 12;
        }
    }
    insertLine(req,lines);

    if (req.headers["Content-Length"]!=undefined && req.headers["Content-Length"]!=0){
        req.bodyExist=true;
        return (bodyChecker(req));
    }
    else{
        return true;
    }
    req.first=false;
}

function bodyChecker(req){
    if(req.body.length>req.headers["Content-Length"])
        console.log("need to split to two massages");
    else if(req.body.length<req.headers["Content-Length"])
        return false;
    else
        return true;

}

function insertLine(req,lines){
    var headerSpliter=/\b([^:]+):(.+)/;
    var i;
    for (i=1;i<lines.length;i++){
        if(lines[i].trim().length==0){
            req.isHead=false;
            return i+1;
        }
        else{
            var  match= headerSpliter.exec(lines[i]);
            if(match!=null){
                match[1]=capitaliseFirstLetter(match[1].trim());
                req.headers[match[1].trim()]=match[2].trim();
            }
            else{
                req.isHead=false;
            }
        }
    }
    return i;

}

function parseRequest(line,req){
    var version=/\bHTTP\/(1.[0|1])\b/;
    curr=line.split(space);
    if (curr.length!=3)
        throw 'NONFREAKINGPARSABLE';
    req.url=curr[1];
    var match =version.exec(curr[2]);
    if(match!=null){
        req.httpVersion=match[1];
    }
    req.method=typeDetector(curr[0]);
    if (req.httpVersion==='1.1'){
        req.keepAlive=true;
    }
    else if(!(req.httpVersion==='1.0')){
        throw 'NONFREAKINGPARSABLE';
    }
}

typeDetector=function(line){
    var type;
    get='GET'
    post='POST'
    DELETE='DELETE'
    put='PUT'

    if (line.toLowerCase()==get.toLowerCase()){
        type=get;
    }
    else if(line.toLowerCase()==post.toLowerCase() ){
        type=post;
    }
    else if(line.toLowerCase()==DELETE.toLowerCase() ){
        type=DELETE;
    }
    else if(line.toLowerCase()==put.toLowerCase() ){
        type=put;
    }
    else {
        throw 'NON-GET-REQUEST';
    }
    return type;
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




exports.parseReq = parse;