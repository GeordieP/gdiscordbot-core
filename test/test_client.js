'use strict'

const expect = require('chai').expect
const should = require('chai').should

const path = require('path')
const null_logger = require('./data/null_logger')

const Client = require('../src/discord/Client')

describe('Client', function() {
    describe('#constructor()', function() {
        let client

        it('Should return a valid object', function(done) {
            client = new Client(null_logger)
            expect(client).to.be.an('object')

            done()
        })

        it('Should expose crucial functions', function(done) {
            const public_function_names = [
                'connect',
                'disconnect',
                'addEventListener',
                'removeEventListener',
            ]

            public_function_names.map(name => {
                expect(client).to.have.property(name).and.to.be.a('function')
            })

            done()
        })
    })

    describe('Connect and Disconnect', function() {
        let client = new Client()
        it('Should connect successfully and return a resolved promise', function() {
            return client.connect()
        })

        it('Should disconnect successfully and return a resolved promise', function() {
            return client.disconnect()
        })
    })

    describe('add and remove event listener', function() {
        let client = new Client()
        function mockCallbackFunc() { }

        it('Should accept and store a given event listener, and return a resolved promise', function() {
            return client.addEventListener("MESSAGE_CREATE", mockCallbackFunc)
                .then(() => {
                    let eventListeners = client.getEventListeners()

                    // should have MESSAGE_CREATE key
                    expect(eventListeners).to.have.property("MESSAGE_CREATE")

                    // contents array should contain one item
                    expect(eventListeners["MESSAGE_CREATE"].length).to.equal(1)
                })
                .catch(e => {
                    throw new Error(e)
                })
        })

        it('Should successfully remove given event listener, and return a resolved promise', function() {
            return client.removeEventListener("MESSAGE_CREATE", mockCallbackFunc)
                .then(() => {
                    let eventListeners = client.getEventListeners()
                    expect(eventListeners["MESSAGE_CREATE"].length).to.equal(0)
                })
        })
    })
})
