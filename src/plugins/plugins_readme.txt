Place your plugins in this directory.

Acceptible plugin formats:
    Standalone JS file:
        A single JavaScript file in the /plugins/ directory with a .js extension. Useful for simple plugins that don't need to rely on other files.
        This file acts as the plugin entry file. The name of the file will be registered as the name of the plugin. 

    Directory
        A directory containing at least one plugin entry JavaScript file, named "plugin.js". This plugin.js file acts as the plugin entry file.
        The directory name will be registered as the name of the plugin.


Entry File Guidelines:
    Entry file should export a function that accepts a single argument. This argument will recieve a reference to the active PluginAPI object. Refer to git repo readme for usage.
