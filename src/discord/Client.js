'use strict'

const Discordie = require('discordie')
const EVENT_TYPES = require('../util/discordie_event_types')
const CREDENTIALS = require('./credentials.js')

const default_logger = require('../util/logger')
/*
* Client
*
* log - logger object
* => undefined
*/
module.exports = function(logger = default_logger) {
    // public
    let pub = {}

    // private
    this.discord = new Discordie()
    this.client_id = null
    this.event_listeners = {}

    /*---
    * private functions
    ---*/

    /*
    * called on client connect event
    * 
    * e - event object (refer to Discordie event docs page
    * => undefined
    */
    this.connected = (e) => {
        // keep track of our discord account user ID
        this.client_id = this.discord.User.id

        logger.info(this.discord.User.username + " successfully connected to " + this.discord.Guilds.length + " servers")
    }

    /*
    * called on client disconnect event
    * 
    * e - event object (refer to Discordie event docs page
    * => undefined
    */
    this.disconnected = (e) => {
        // on reconnect, call connect again
        // only register a "once" listener here as we don't expect it to happen often
        this.discord.Dispatcher.once('GATEWAY_RESUMED', ee => this.connected(ee))

        logger.error("Lost Connection", e.error ? e.error : null)
        
        if (e.autoReconnect) {
            logger.error("[Delay: " + e.delay + "] Attempting to reconnect...")
        }
    }

    /*---
    * public functions
    ---*/
    
    /*
    * establish a discord connection 
    * 
    * e - event object (refer to Discordie event docs page
    * => Promise
    */
    pub.connect = () => new Promise((resolve, reject) => { 
        try {
            this.discord.connect({ token: CREDENTIALS.DISCORD_CLIENT_TOKEN })
            // only register a "once" listener here as we don't expect it to happen often
            this.discord.Dispatcher.once("GATEWAY_READY", e => {
                this.connected(e)
            })
            pub.addEventListener("DISCONNECTED", this.disconnected)
        } catch (e) {
            reject(e)
        }
        
        resolve()
    })

    /*
    * terminate discord connection
    * 
    * => Promise
    */
    pub.disconnect = () => {
        try {
            this.discord.disconnect()
        } catch (e) {
            return Promise.reject(e)
        }

        return Promise.resolve()
    }

    /*
    * bind a listener function to a Discordie event type
    * 
    * event_type - Discordie event type (see Discordie docs Events page for all types)
    * func - listener callback function - takes event arg (see Discordie docs Events page for event arg contents per type)
    * => Promise
    */
    pub.addEventListener = (event_type, func) => new Promise((resolve, reject) => {
        if (EVENT_TYPES.indexOf(event_type) === -1) {
            reject("Not a valid event type")
        }

        if (!this.event_listeners.hasOwnProperty(event_type)) {
            // event type has not been previously registered
            // create a callbacks array in listeners object
            // with passed event type as key
            this.event_listeners[event_type] = new Array()

            // create a handler function in discordie.Dispatcher
            this.discord.Dispatcher.on(event_type, e => {
                // ignore events from our current discord account if a user object is
                // attached to the incoming event
                if (e.user && e.user.id === this.client_id){
                    return
                } 

                // call every listener function for event type
                for (let i = 0; i < this.event_listeners[event_type].length; i++) {
                    this.event_listeners[event_type][i].call(null, e)
                }
            })
        }
        // otherwise this event_type has been added previously and a handler function
        // has already been registered in discord.Dispatcher
        // all we need to do is the following

        // add the callback to the array at key matching passed event type
        this.event_listeners[event_type].push(func)

        resolve()
    })

    /*
    * unbind a listener function from Discordie events
    * 
    * event_type - Discordie event type (see Discordie docs Events page for all types)
    * func - listener callback function - must be a reference to an existing named function; cannot be anonymous
    * => Promise
    */
    pub.removeEventListener = (event_type, func) => new Promise((resolve, reject) => {
        let func_index = this.event_listeners[event_type].indexOf(func)
        if (func_index === -1) {
            reject("No matching listener function found for event " + event_type)
        }

        this.event_listeners[event_type].splice(func_index, 1)
        resolve()
    })

    /*
    * return active event listeners
    *
    * => object
    */
    pub.getEventListeners = () => {
        return Object.assign({}, this.event_listeners)
    }

    return pub
}
