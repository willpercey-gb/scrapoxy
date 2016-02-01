'use strict';

const Commander = require('./commander'),
    Manager = require('./manager'),
    Master = require('./master'),
    Stats = require('./stats'),
    winston = require('winston');


module.exports = class Proxies {
    constructor(config) {
        this._config = config;

        // Stats
        this._stats = new Stats(this._config.commander.stats);

        // Init Manager
        this._manager = new Manager(
            this._config.manager,
            this._stats
        );

        // Init Master
        this._master = new Master(
            this._config.master,
            this._manager,
            this._stats
        );

        // Init Commander
        this._commander = new Commander(
            this._config,
            this._manager,
            this._stats
        );
    }


    get manager() {
        return this._manager;
    }


    listen() {
        winston.debug('[Main] listen');

        // Start Commander
        return this._commander
            .listen()
            .then(() => {
                // Start Manager
                this._manager.start();

                // Start Master
                return this._master.listen();
            });
    }


    listenAndWait() {
        winston.debug('[Main] listenAndWait');

        return this
            .listen()
            .then(() => this._manager.waitForAliveInstances(this._config.instance.scaling.min));
    }


    shutdown() {
        winston.debug('[Main] shutdown');

        this._master.shutdown();
        this._commander.shutdown();

        return this._manager
            .stop()
            .then(() => winston.info('All instances are stopped.'));
    }
};
