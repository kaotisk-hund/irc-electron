const {ipcMain} = require('electron');
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
   	
    client.addListener('registered', function(mess){
      console.log('CDed')
      console.log('Nickname: ' + client.nick)
      console.log(mess)
      client.join(channel);
      setListeners(client);
    })
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

function setListeners(client){
  client.addListener('message'+channel, function (from, message) {
    data = {from, message};
    // TODO add the function that adds the message
  });

  ipcMain.on('irc_send', function(e, data){
    message = data;
    if (client === null) {
      console.log('wtf??? Maybe disconnected... Most likely.')
    } else {
      console.log('Seems you are online... going to send that message...')
      client.say(channel,message)
    }
    data = {nickname, message};
    // TODO add the function that adds the message
    console.log(data)
  })

}

module.exports = {
	disconnect,
	connect
}