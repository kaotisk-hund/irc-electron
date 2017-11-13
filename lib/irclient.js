const irc = require('irc');

function connect(e, thadata, client){
  //win.webContents.send('irc:connect', thadata);
  console.log(e)
  server = thadata.server;
  nickname = thadata.nickname;
  channel = thadata.channel;
  username = nickname+'_kirc';
  realname = nickname+' at KiRc';
  
  console.log('=========   Your login info   =========')
  console.log(server)
  console.log(nickname)
  console.log(channel)


  console.log('.............')

   if (client === null){
   	client = new irc.Client(server, nickname, {
		channels: [
			channel
		],
		userName: username,
		realName: realname
	  });
   	console.log('CDed')
   	console.log('Nickname: '+nickname)
   } else {
   	client = null
   	console.log('DCed')
   }
   console.log('.............')
  
  
  client.join(channel);
  client.addListener('message'+channel, function (from, message) {
	addMessageToBoard(from,message);
    console.log(from + ': ' + message);

  });
  
  //addWindow.close(); 
  // Still have a reference to addWindow in memory. Need to reclaim memory (Grabage collection)
  //addWindow = null;
}

function disconnect(){
	client = null;
}

function addMessageToBoard(from,message,win){
	var data = {from, message};
    win.webContents.send('irc_message', data);
    data = null;
}



module.exports = {
	disconnect,
	connect,
	addMessageToBoard
}