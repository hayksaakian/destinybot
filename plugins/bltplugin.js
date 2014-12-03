var BLTPlugin = {
    init: function (client, imports) {
        return {
            exports: null,
            handlers: {
                '!givemeblt': function (message) {
                    client.say('/me gives a juicy BLT to ' + message.nick);
                }
            },

            help: {
                'command': [
                    '!givemeblt',
                    ' ',
                    'Gives the requestor a juicy BLT.'
                ]
            },

            commands: ['givemeblt'],
            hooks: null
        }
    }
};

module.exports = BLTPlugin;