'use strict';
/**
 * Automatically read posts from a list of topics and saves them in a database.
 *
 * @module mafia-reader
 * @author Jarry
 * @license MIT
 */

const Db = require('tingodb')().Db;
const utils = require('../lib/utils');
const path = require('path');

/**
 * Default configuration settings
 * @typedef {object}
 */
const defaultConfig = {
        /**
         * @type String
         */
        dbPath : './db.tingo'
    },
    /**
     * Internal status store
     * @typedef {object}
     */
    internals = {
        /**
         * Browser to use for communication with discourse
         * @type {Browser}
         */
        browser: null,
        /**
         * Instance configuration
         * @type {object}
         */
        config: defaultConfig,
        /**
         * DB used to store the posts
         */
        db: null,
        posts: null,
        /**
         * EventEmitter used for internal communication
         * @type {externals.events.SockEvents}
         */
        events: null,
        /**
         * Extended help message
         */
        extendedHelp: 'Automatically read posts from a list of topics and saves them in a database.'
    };


/**
 * Prepare Plugin prior to login
 *
 * @param {*} plugConfig Plugin specific configuration
 * @param {Config} config Overall Bot Configuration
 * @param {externals.events.SockEvents} events EventEmitter used for the bot
 * @param {Browser} browser Web browser for communicating with discourse
 */
exports.prepare = function (plugConfig, config, events, browser) {
    internals.browser = browser;
    if (typeof plugConfig !== 'object') {
        plugConfig = {};
    }
    internals.events = events;
    internals.config = config.mergeObjects(true, defaultConfig, plugConfig);
    utils.log(path.normalize(internals.config.dbPath));
    internals.db = new Db(path.resolve(internals.config.dbPath), {});

    internals.posts = internals.db.collection('posts');

    events.registerHelp('mafia-reader', internals.extendedHelp, () => 0);

    events.onNotification('posted', exports.handlePost);
};

/**
 * Start the plugin after login
 */
exports.start = function () {
    exports.crawl();
};

/**
 * Stop the plugin prior to exit or reload
 */
exports.stop = function () {
    internals.db.close();
};

exports.crawl = function() {
    internals.config.games.forEach(function(game){
        utils.log('Proccesing game: ' + game.id);
        //const topics = internals.posts.mapReduce ( {$match: {game: game.id}},{$group: {id: '$topic_id'}});
        const map = function(){ emit(this.topic_id, 1);};
        const reduce = function(key, values){ return 1; };
        let topics = internals.posts.mapReduce ( map, reduce, {out: 'ids'}, function(){});
        if (topics === undefined) topics = [];
        game.topics.forEach(function(topicId){
            utils.log('proccesing topic id: ' + topicId);
            /*
                if there are posts for the current topic_id,
                i assume that there are all posts for the current topic, this may not be a safe assumption
                later i can get the posts ids, and check if they are in the collection
             */
            if (topics.indexOf(topicId) === -1){
                utils.log('topic id: ' + topicId + ' is not in the DB, fetching posts');
                internals.browser.getPosts(topicId, exports.insertPost.bind(null, game.id),function(){utils.log('proccesed topic id: '+topicId);});
            }
            internals.browser.setNotificationLevel(topicId, 3);
            //internals.browser.readPosts(topicId);
        });

    });
};

exports.insertPost = function(gameId, post) {
    utils.log('proccesing post id: ' + post.id);
    post.game = gameId;
    internals.posts.insert(post);
};

/**
 * Handle notifications
 *
 * @param {external.notifications.Notification} notification Notification received
 * @param {external.topics.Topic} topic Topic trigger post belongs to
 * @param {external.posts.CleanedPost} post Post that triggered notification
 */
exports.handlePost = function(notification, topic, post) {
    internals.config.games.every(function(game){
        if (game.topics.indexOf(post.topic_id) > -1) {
            exports.insertPost(game.id, post);
            return false;
        }
    });

};

/* istanbul ignore else */
if (typeof GLOBAL.describe === 'function') {
    //test is running
    exports.internals = internals;
}
