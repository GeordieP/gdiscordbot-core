gdiscordbot-core
===================
*For lack of a better name.*

A [Discord](https://discordapp.com/) chat bot platform designed around the idea of easily writing plugins to extend and customize bot functionality.

----------

## Install
1) Clone this repository
2) `cd` into the cloned repo directory and run `npm i`, or `yarn` if you've got yarn.

## Setup
1) `cd` to `[project root]/src/discord/` and rename "credentials_template.js" to "credentials.js".
2) Open the "credentials.js" file in a text editor and update the "DISCORD_CLIENT_TOKEN" string with your token. Read the comments given in the template file for more details.
3) Create or install a plugin. See **Plugin Creation** for more information.


## Run
1) Run `npm start` in project root directory

## Test
1) Run `npm test` in project root directory

---
## Plugin Creation

There are two ways to create a plugin.

##### First Option:
- Create a directory, containing a "plugin.js" file. The directory can contain any other files you'd like to use, but it must contain "plugin.js" to be recognized by the platform. The directory name will be used as the plugin name. Nested directories, or a top level directory without a "plugin.js" file inside will be ignored.

##### Second Option:
- Create a single .js file in the `./src/plugins/` directory. The file name will be usd as the plugin name.


If you are planning to split plugin code into multiple files, use the directory method. The single file method is good for simple plugins that won't require a ton of programming.

Both methods are different ways of defining the same thing: the entry point JavaScript file. These entry files should adhere to a simple standard:

- Export a function that accepts one argument (often called 'client' or 'plugin_api'). This argument will be passed a reference to the bot platform plugin API when the plugin is being loaded. See **Using Plugin API** for the functions exposed in this argument.
 
Aside from the above guideline, your plugin can use anything else. Require other files, npm dependencies, etc.


---

## Using Plugin API
The plugin API sits between a plugin and the Discord client, and provides easy ways to attach functionality to things happening inside Discord.

#### Available Functions:

##### registerCommand(names: string OR array of strings, callback: function)
- Store the given callback function in the PluginManager, keyed on each given name. If a command message is detected, and the name matches an existing key in the stored commands object, the callback function will be called.

##### addDiscordEventListener(event_type: string, callback: function)
- Store the given callback function in the Discord Client. When Discord recieves an event with a type string matching what is passed, all registered callbacks associated with that type will be called.

##### addDiscordEventListener(event_type: string, callback: function)
- Remove the given callback function from the Discord Client event listener store.

#### Helper Functions:

The add and remove event listener functions listed above can be used to access any event in discord by providing a valid event_type string, but for common use cases, some helper functions are available to eliminate the need to specify event_type explicitly.

##### registerMessageCreateListener(callback: function)
- Call the given callback function for every new Discord message (Event type: `MESSAGE_CREATE`)
##### unregisterMessageCreateListener(callback: function)
- Unregister named callback function from message create

##### registerMessageEditListener(callback: function)
- Call the given callback function for every Discord message update event (Event type: `MESSAGE_UPDATE`)
##### unregisterMessageEditListener(callback: function)
- Unregister named callback function from message update

##### registerMessageDeleteListener(callback: function)
- Call the given callback function for every Discord message delete event (Event type: `MESSAGE_DELETE`)
##### unregisterMessageDeleteListener(callback: function)
- Unregister named callback function from message delete

##### registerReactionAddListener(callback: function)
- Call the given callback function for every Discord message reaction add (Event type: `MESSAGE_REACTION_ADD`)
##### unregisterReactionAddListener(callback: function)
- Unregister named callback function from message reaction add

##### registerReactionRemoveListener(callback: function)
- Call the given callback function for every Discord message reaction remove (Event type: `MESSAGE_REACTION_REMOVE`)
##### unregisterReactionRemoveListener(callback: function)
- Unregister named callback function from message reaction remove

> **Note**: If any Discord client functionality you need is missing from the plugin API, request it in the repository issue tracker! (Or add the feature yourself and submit a pull request)


