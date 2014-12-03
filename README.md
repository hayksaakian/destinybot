# Node.js based Chat Bot for Destiny.gg chat

## setup

you will need NPM and node.js installed.*

    npm install

to get dependencies

run once

    node app.js

and it will create the necessary files from examples.

the very least you need to do to get a working setup is simply:

### Set a DESTINYGG_API_KEY in the environment (via .env for example)

You can get this key from your profile page on destiny.gg, look for 'api keys' 

Note: if you don't to use a .env file, (dot env) set a NODOTENV environment variable to TRUE

* in the future we may package the bot with https://www.npmjs.org/package/nar because it will enable installing the bot without node.js or npm already installed

## plugins

the plugin model is similar to tennu's plugin style

http://tennu.github.io/documentation/getting-started

see plugins/bitplugin.js as an example

in order to add a plugin, add a PLUGIN_NAME.js file 
to the plugins folder (follow the pattern for plugins)

to activate a plugin, make sure the name of the plugin 
is listed in the 'list' variable within config/plugins.json

the whole reason for all this is so plugins can be trivially 
activated/deactivated via the file system, or via chat commands (See: TODO)

Note: If you need new npm packages, install them with

    npm install PACKAGE_NAME --save

make sure to add --save so they get saved to the package.json file

# TODO:

see this for goals:

https://www.reddit.com/r/Destiny/comments/2nwchw/housekeeping/

other than that, we want feature parity with dharmabot, see: 

https://github.com/dharmaturtle/DharmaBot/blob/master/DharmaBot.py

the goal is feature parity

- generic, regex based event registration
- plugins/manager.js to toggle plugins from chat
- plugins/blacklist.js to manage and detect blacklisted text within messages
- plugins/lastfm.js
- plugins/sc2.js
- plugins/time.js
- plugins/etc...





