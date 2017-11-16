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
   	console.log('Nickname: ' + client.opt.nick)
    client.join(channel);
    return client;
   } else {
   	//client = null
   	console.log('Now client is not set null BUT nothing else happens :D')
   }
   console.log('.............')
}

function disconnect(client){
	client.disconnect();
  client = null;
}

}

module.exports = {
	disconnect,
	connect
}