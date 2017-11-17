/*
 * This is the main.js file. The file that electron runs.
 * While this is done there are some things going on here!
 * -Duh!
 * -I know, right?
 * Well, I am going to fully document this, show read comments
 * below.
 */

// Getting 4 basic elements of electron into place
const {app, BrowserWindow, ipcMain, Menu} = require('electron')
// Required so we can load urls
const url = require('url')
// ... and paths
const path = require('path')

// Now, we are going to use node-irc for our project also.
const irc = require('irc')
// This is a temporary library just for learning how to make one.
const irclient = require('./lib/irclient.js')

// Set NODE_ENV to either 'production' or 'development'.
process.env.NODE_ENV = 'development'

/*
 * Test line for irclient (eg if successfully loaded)
 * Lesson learnt: Outputs the functions that this module exports
 */
console.log(irclient)

/*
 * Here I am setting some variables that I want to have
 * central access from here.
 * 
 * client variable is set to null so that we know that
 * when the program starts
 */
let server
let nickname
let client = null
let channel
let message
let win


/*
 * I thought it would be nice to use try and catch for
 * this project and also learn it better this way
 */
try {

	/*
	 * This is the section where 2 windows are set.
	 * mainWindow() and settingsWindow().
	 */

	/*
	 * Creates the main window!!!
	 */
	function mainWindow () {
		// Create the browser window.
		win = new BrowserWindow({width: 800, height: 600})
		
		// and load the index.html of the app.
		win.loadURL(url.format({
			pathname: path.join(__dirname, 'index.html'),
			protocol: 'file:',
			slashes: true
		}))

		// Open the DevTools.
		// win.webContents.openDevTools() // Temporarily commented out, as we have the option from the menu.

		// Emitted when the window is closed.
		win.on('closed', () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			win = null		// Empty the win variable
			app.quit();		//Quit the application
		})

		// Build menu from template
		const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
		// Insert menu
		Menu.setApplicationMenu(mainMenu);
		// return win; // Might be useless
	}

	/*
	 * Creates settings window
	 */
	function settingsWindow(){
		setWin = new BrowserWindow({width: 300, height: 350})

		setWin.loadURL(url.format({
			pathname: path.join(__dirname, 'settings.html'),
			protocol: 'file:',
			slashes: true
		}))
		setWin.on('closed', () => {
				// Dereference the window object, usually you would store windows
				// in an array if your app supports multi windows, this is the time
				// when you should delete the corresponding element.
				setWin = null
		})
	}
	/*
	 * Creates about window
	 */
	function aboutWindow(){
		about = new BrowserWindow({width: 300, height: 330})

		about.loadURL(url.format({
			pathname: path.join(__dirname, 'about.html'),
			protocol: 'file:',
			slashes: true
		}))
		about.on('closed', () => {
				// Dereference the window object, usually you would store windows
				// in an array if your app supports multi windows, this is the time
				// when you should delete the corresponding element.
				about = null
		})
	}





	// SOME OTHER PART OF THE PROGRAM
	/*
	 * A function for sending messages to mainWindow
	 */
	function addMessageToBoard(data){
		win.webContents.send('irc_message', data);
		data = null;
	}



	// Add a message at channel listener
	ipcMain.on('sig', function(e,data){
		addMessageToBoard(data)
	})
	


	// Connect Function
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
      console.log('CDed');
      console.log('Nickname: ' + client.nick);
      console.log(mess);
      win.webContents.send('irc_cded');
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
    addMessageToBoard(data)
  });

  ipcMain.on('irc_send', function(e, data){
    message = data;
    if (client === null) {
      console.log('wtf??? Maybe disconnected... Most likely.')
    } else {
      console.log('Seems you are online... going to send that message...')
      client.say(channel,message)
    }
    from = nickname
    data = {from, message};
    // TODO add the function that adds the message
    addMessageToBoard(data)
    console.log(data)
  })

}


	// Catch irc_connect
	ipcMain.on('irc_connect', function(e, thedata){
		client = connect(e, thedata, client)
		console.log(client)
		
	});



	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	app.on('ready', mainWindow)

	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
		// On macOS it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('activate', () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (win === null) {
			mainWindow()
		}
	})

	// In this file you can include the rest of your app's specific main process
	// code. You can also put them in separate files and require them here.
} catch (e){
	console.log(e.message);
}


/*
 * This is the part of the program that creates
 * the main menu.
 *
 */

// Create menu template
const mainMenuTemplate =	[
	// Each object is a dropdown
	{
		label: 'File',
		submenu:[
		/*	 {
				label:'Add Item',
				click(){
					createAddWindow();
				}
			},
			{
				label:'Clear Items',
				click(){
					mainWindow.webContents.send('item:clear');
				}
			},*/
			{
				label: 'Quit',
				accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
				click(){
					app.quit();
				}
			}
		]
	},
	{
		label: 'Options',
		submenu:[
			{
				label:'Connection settings',
					accelerator:process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
				click(){
					settingsWindow();
				}
			},
			{
				label:'Connect'
			},
			{
				label:'Disconnect',
					accelerator:process.platform == 'darwin' ? 'Command+D' : 'Ctrl+D',
				click(){
					irclient.disconnect(client);
				}
			}
		]
	},
	{
		label: 'Help',
		submenu:[
			{
				label: 'About',
				click(){
					aboutWindow();
				}
			}
		]
	}
];

// If OSX, add empty object to menu
if(process.platform == 'darwin'){
	mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== 'production'){
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu:[
			{
				role: 'reload'
			},
			{
				label: 'Toggle DevTools',
				accelerator:process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
				click(item, focusedWindow){
					focusedWindow.toggleDevTools();
				}
			}
		]
	});
}