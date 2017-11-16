const {app, BrowserWindow, ipcMain, Menu} = require('electron')
const url = require('url')
const path = require('path')
const irc = require('irc')
const irclient = require('./lib/irclient.js')
process.env.NODE_ENV = 'development'

console.log(irclient)

let server
let nickname
let client = null
let channel
let message
let win

try {

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
		setWin = new BrowserWindow({width: 300, height: 330})

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

// Add a message at channel listener
if (client !== null){
	client.addListener('message'+channel, function (from, message) {
		addMessageToBoard(from,message,win);
		console.log(from + ': ' + message);
	});
}
	/*
	 * A function for sending messages to mainWindow
	 */
	function addMessageToBoard(from,message){
		var data = {from, message};
			win.webContents.send('irc_message', data);
			data = null;
	}


// Send message
ipcMain.on('irc_send', function(e, message){
	client.say(channel,message)
	addMessageToBoard(nickname,message,win);
})

// Catch irc_connect
ipcMain.on('irc_connect', function(e, thedata){
	client = irclient.connect(e, thedata, client)
});
		win.webContents.send('irc_cded')



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
					irclient.disconnect();
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