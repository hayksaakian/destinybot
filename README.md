# Node.js based Chat Bot for Destiny.gg chat

## setup

you will need NPM and node.js installed.*

    npm install

to get dependencies

make a protocol.json file in the config folder containing an apikey
follow the example of config/example.protocol.json

the very least you need to do to get a working setup is simply:

### Set a apikey variable in the protocol.json

You can get this key from your profile page on destiny.gg, under authentication,  look for 'api keys' 

* in the future we may package the bot with https://www.npmjs.org/package/nar because it will enable installing the bot without node.js or npm already installed

## plugins

see plugins/bitplugin.js as an example

in order to add a plugin, add a PLUGIN_NAME.js file 
to the plugins folder

by placing it in the proper folder, your plugin will be activated.
eventually plugins should be toggle-able via chat commands (See: TODO)

Note: If you need new NPM packages, install them with

    npm install PACKAGE_NAME --save

make sure to add --save so they get saved to the package.json file

# TODO:

see these for goals:

http://www.reddit.com/r/Destiny/comments/2o7qf4/new_chat_bot_other_chat_features/

https://www.reddit.com/r/Destiny/comments/2nwchw/housekeeping/

other than that, we want feature parity with dharmabot, see: 

https://github.com/dharmaturtle/DharmaBot/blob/master/DharmaBot.py

the goal is feature parity

- generic, anything based event registration
- plugins/manager.js to toggle plugins from chat
- plugins/blacklist.js to manage and detect blacklisted text within messages
- plugins/lastfm.js
- plugins/sc2.js
- plugins/time.js
- plugins/etc...





