/*
 * This is the main.js file. The file that electron runs.
 * While this is done there are some things going on here!
 * -Duh!
 * -I know, right?
 * Well, I am going to fully document this, show read comments
 * below.
 */

// Getting 4 basic elements of electron into place
const {app, BrowserWindow, ipcMain, Menu, Tray} = require("electron");
// Required so we can load urls
const url = require("url");
// ... and paths
const path = require("path");

// Now, we are going to use node-irc for our project also.
const irc = require("irc");

// Added ipfs
const ipfs = require("ipfs-api");

// so we can read local files
const fs = require("fs");

// Set NODE_ENV to either "production" or "development".
process.env.NODE_ENV = "development";

/*
 * Here I am setting some variables that I want to have
 * central access from here.
 * 
 * client variable is set to null so that we know that
 * when the program starts
 */
let server;
let nickname;
let username;
let realname;
let client = null;
let channel;
let message;
let win;
let setWin;
let about;
let data;
let hash;
let mdata;
let cl;
let tray = null;

/*
 * Creates settings window
 */
function settingsWindow(){
	setWin = new BrowserWindow({width: 300, height: 350});

	setWin.loadURL(url.format({
		pathname: path.join(__dirname, "settings.html"),
		protocol: "file:",
		slashes: true
	}));
	setWin.on("closed", () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			setWin = null;
	});
}

/*
 * Creates about window
 */
function aboutWindow(){
	about = new BrowserWindow({width: 320, height: 200});

	about.loadURL(url.format({
		pathname: path.join(__dirname, "about.html"),
		protocol: "file:",
		slashes: true
	}));
	about.on("closed", () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			about = null;
	});
}

/*
 * This is the part of the program that creates
 * the main menu.
 *
 * Create menu template
 */
const mainMenuTemplate =	[
	// Each object is a dropdown
	{
		label: "File",
		submenu:[
			/*{
				label:"IPFS test",
				click(){
					ipfsinit(ipfs);
				}
			},
			{
				label:"Clear Items",
				click(){
					mainWindow.webContents.send("item:clear");
				}
			},*/
			{
				label: "Quit",
				accelerator:process.platform === "darwin" ? "Command+Q" : "Ctrl+Q",
				click(){
					app.quit();
				}
			}
		]
	},
	{
		label: "Options",
		submenu:[
			{
				label:"Connection settings",
					accelerator:process.platform === "darwin" ? "Command+S" : "Ctrl+S",
				click(){
					settingsWindow();
				}
			},
		/*	{
				label:"Connect"
			},
			{
				label:"Disconnect",
					accelerator:process.platform == "darwin" ? "Command+D" : "Ctrl+D",
				click(){
					disconnect();
				}
			}*/
		]
	},
	{
		label: "Help",
		submenu:[
			{
				label: "About",
				click(){
					aboutWindow();
				}
			}
		]
	}
];

// If OSX, add empty object to menu
if(process.platform === "darwin"){
	mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== "production"){
	mainMenuTemplate.push({
		label: "Developer Tools",
		submenu:[
			{
				role: "reload"
			},
			{
				label: "Toggle DevTools",
				accelerator:process.platform === "darwin" ? "Command+I" : "Ctrl+I",
				click(item, focusedWindow){
					focusedWindow.toggleDevTools();
				}
			}
		]
	});
}

/*
 * Creates the mainWindow() !!!
 */
function mainWindow () {
	// Create the browser window.
	win = new BrowserWindow({width: 800, height: 600});
	
	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, "index.html"),
		protocol: "file:",
		slashes: true
	}));

	// Open the DevTools.  // TODO: Remove
	// win.webContents.openDevTools() // Temporarily commented out, as we have the option from the menu.

	// Emitted when the window is closed.
	win.on("closed", () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;		// Empty the win variable
		app.quit();		//Quit the application
	});

	// Build menu from template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	// Insert menu
	Menu.setApplicationMenu(mainMenu);
}

/*
 * A function for sending messages to mainWindow
 */
function addMessageToBoard(data){
	win.webContents.send("irc_message", data);
	data = null;
}

/*
 * A function for sending files to mainWindow
 */
function addFileToBoard(data){
	win.webContents.send("ipfs_file", data);
	data = null;
}


// Add a message at channel listener
ipcMain.on("sig", function(e,data){
	addMessageToBoard(data);
}); // I think it's not used anywhere

// Initiator for IPFS
function ipfsinit(client, ipfs, file, name){
	var cl = ipfs("localhost",5001); // Just connect
	//console.log("IPFS connected");
	// The following is the way of getting files to add them to ipfs (buffer type)
	fs.readFile(file, function(err, data){
		//console.log("File read!");
		cl.files.add(data, function(err, filesAdded){ // Test line for adding
			var file1 = filesAdded[0];
			//console.log("File uploaded");
			file = name;
			var hash = "/ipfs/" + file1.hash;
			var link = "http://127.0.0.1:8080" + hash;
			data = {file, link};
			mdata = name + " -> " + link;
			client.say(channel, mdata);
			addFileToBoard(data);
		});
	});

	
}

// Sets event listeners for various stuff
function setListeners(client){
	// For finding messages on current channel
	client.addListener("message"+channel, function (from, message) {
		data = {from, message};
		addMessageToBoard(data);
	});

	// For sending messages
	ipcMain.on("irc_send", function(e, data){
		message = data;
		if (client === null) {
		//	console.log("wtf??? Maybe disconnected... Most likely.")
		} else {
		//	console.log("Seems you are online... going to send that message...")
			client.say(channel,message);
		}
		var from = nickname;
		data = {from, message};
		addMessageToBoard(data);
	});

	// For uploading files
	ipcMain.on("ipfs_upload", function(e, dfile, dname){
		//console.log(dfile);
		var file = dfile;
		name = dname;
		if (client === null) {
			//console.log("Tried for client... none found");
		} else {
			//console.log("Seems okay... going to send that file...");
			ipfsinit(client, ipfs, file, name);
		}
	});

	// For changing nickname
	ipcMain.on("irc_set_nick", function(e, nickname){
		client.send("NICK", nickname);
	});
}

/*
 * connect() Function
 * This function is used to make the connection with the
 * IRC server, set some listeners for events and pass the
 * necessary variables to other places where needed.
 * 
 * It gets 3 variables.
 * e, which contains possible errors,
 * thadata, which contains connection information and
 * client, where the IRC client object is stored.
 */
function connect(e, thadata, client){
	//win.webContents.send("irc:connect", thadata);
	//console.log(e)
	server = thadata.server;
	nickname = thadata.nickname;
	channel = thadata.channel;
	username = nickname+"_kirc";
	realname = nickname+" at KiRc";

	if (client === null){
		// Create new client while connecting to the server
		client = new irc.Client(server, nickname, {
		channels: [
			channel
		],
		userName: username,
		realName: realname
		});

		/*
		 * Well, after creating a client, we add some listeners
		 * here. See setListeners() function.
		 */
		setListeners(client);
		/*
		 * Wait for connection to inform irc-electron and
		 * join a channel. Also, we send the nickname for
		 * the user to see and change.
		 */
		client.addListener("registered", function(mess){
			win.webContents.send("irc_cded");
			win.webContents.send("irc_nick", client.nick);
			client.join(channel);
		});

		// Wait for and print the Message of the Day.
		client.addListener("motd", function(motd){
			data = {
				from:"Message of the day",
				message:motd
			};
			addMessageToBoard(data);
		});

		// Wait for topic change so we can put it on top.
		client.addListener("topic", function (channel, topic){
			data = {channel, topic};
			win.webContents.send("irc_chann", data);
		});

		/*
		 * When we change the nickname make sure we change the
		 * program's variables too.
		 */
		client.addListener("nick", function (onick, nnick){
			nickname = nnick;
			win.webContents.send("irc_nick", client.nick);
		});
	} else {
		/*
		 * I was left over with an if-else statement where the
		 * else never do anything.
		 */
	}
}

// Unused... I was going to add a disconnect function
// but it seems node-irc has something for this. I guess
// I have TODO: Add disconnect option!
function disconnect(client){
	client.disconnect();
	client = null;
}

// Catch irc_connect, when the user triggers connection.
ipcMain.on("irc_connect", function(e, thedata){
	client = connect(e, thedata, client);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", mainWindow);

// Here I use the app's icon to let it run on tray.
app.on("ready", () => {
	tray = new Tray("assets/icons/png/icon.png");

	// Just a quit option
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Quit",
			click(){
				app.quit();
			}
		}
	]);

	// Show/hide on click
	tray.on("click", () => {
		win.isVisible() ? win.hide() : win.show();
	});

	tray.setToolTip("irc-electron");
	tray.setContextMenu(contextMenu);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On macOS it"s common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		mainWindow();
	}
});


