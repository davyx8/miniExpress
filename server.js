var events = require("events");


function server() {
    var port=NaN;    
    var isStarted = false;
    var startDate = NaN;    
	this.allCookies = {};
	this.sessionsTimers = {};
	var that = this;
    var netServer = net.createServer(function (socket) {
        socket.__proto__.secFromLast = 0;
        socket.on('data', function (d) {            
            socket.secFromLast++;						
			var request;
			try{
				request = dynamic.parseRequest();
			}catch(e){
				
			}
            setTimeout(function () {
                socket.secFromLast--;
                if (socket.secFromLast == 0) {
                    socket.end();
                }
            }, settings.LAST_REQUEST_TIMEOUT_SEC);
        });
    });
	this.onStart=function(callback){
		this.on('start',callback);
	}
    this.startServer = function (port) {       
        this.startDate = new Date();
        this.port = port;
        this.isStarted = true;
        netServer.listen(port);
		this.emit('start');
    }

    this.stopServer = function (port){
        this.netServer.close();
        this.isStated = false;
    }
}
util.inherits(server, events.EventEmitter);