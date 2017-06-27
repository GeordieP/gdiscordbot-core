'use strict'

const expect = require('chai').expect
const should = require('chai').should

const path = require('path')
const null_logger = require('./data/null_logger')

const PluginManager = require('../src/PluginManager')

describe('PluginManager', function() {
    describe('#constructor()', function() {
        let pluginManager

        it('Should return a valid object', function(done) {
            pluginManager = new PluginManager()
            expect(pluginManager).to.be.an('object')
            done()
        })

        it('Should expose crucial functions', function(done) {
            const public_function_names = [
                'setClientDisconnectCallback',
                'setEventListenerCallbacks',
                'createDiscordEventListeners',
                'loadPlugins'
            ]

            public_function_names.map(name => {
                expect(pluginManager).to.have.property(name).and.to.be.a('function')
            })

            done()
        })
    })

    describe('#loadPlugins(plugins_dir)', function() {


        // pass unlogger as second param to loadPlugins to prevent it from logging
        const null_logger = {
            error: () => {},
            info: () => {}
        }

        it('Should register all valid plugins in given directory', function() {
            let pluginManager = new PluginManager(null_logger)
            const mock_plugins_directory = './data/mock_plugins/'

            return pluginManager.loadPlugins(path.join(__dirname, mock_plugins_directory))
                .then(() => {
                    let active_plugins = pluginManager.getActivePlugins()

                    // should return an object
                    expect(active_plugins).to.be.an('object')

                    // the following names should be registered
                    const expected_plugin_names = [ 'plugin1', 'plugin2', 'plugin3' ]
                    expected_plugin_names.map(name => {
                        expect(active_plugins).to.have.property(name)
                    })

                    // the following invalid names should have been ignored
                    const invalid_plugin_names = [ 'invalid_plugin_dir', 'invalid_plugin1' ]
                    invalid_plugin_names.map(name => {
                        expect(active_plugins).to.not.have.property(name)
                    })
                })
                .catch(e => {
                    throw new Error(e)
                })
        })

        it('Should give error if passed an invalid directory', function(done) {
            const invalid_plugins_directory = './a/fake/path'
            let pluginManager = new PluginManager(null_logger)

            pluginManager.loadPlugins(path.join(__dirname, invalid_plugins_directory))
                .then(() => {
                    done(new Error("Promise resolved when it was not supposed to"))
                })
                .catch(e => {
                    done()
                })
        })
    })
})
