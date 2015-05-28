'use strict';
var async = require('async'),
    fs = require('fs'),
    yml = require('js-yaml'),
    rpc = require('./compiler/jsonrpc'),
    cheerio = require('cheerio'),
    ent = require('ent');
var database = require('../database'),
    db;
var errors,
    discourse,
    languages,
    config,
    user, pass,
    JsonRpcWrapper,
    ideone;

exports.name = 'Compiler';
exports.version = '0.8';
exports.description = 'Compile and run code!';
exports.configuration = {
    enabled: false,
    user: 'user',
    pass: 'pass'
};

exports.commands = {
    compile: {
        handler: compile,
        params: [],
        defaults: {},
        description: 'Compile All Teh codez.'
    },
    list: {
        handler: listLangs,
        params: [],
        defaults: {},
        description: 'list languages.'
    },
    supported: {
        handler: supported,
        params: [],
        defaults: {},
        description: 'list languages supported.'
    },
    challenge: {
        handler: challenge,
        params: [],
        defaults: {},
        description: 'start a new coding challenge.'
    }
};

exports.begin = function begin(browser, c) {
    discourse = browser;
    languages = yml.safeLoad(fs.readFileSync('./sock_modules/compiler/languages.yml'));
    config = c.modules[exports.name];
    errors = c.errors;
    JsonRpcWrapper = function () {
        this.client = rpc.getClient(80, 'ideone.com');
        this.path = '/api/1/service.json';
        this.call = function (method, params, callback) {
            this.client.call(method, params, callback, null, this.path);
        };
    };
    database.getDatabase(exports.name, function (err, data) {
        ready = !err;
        db = data;
        db.createIndex({
            modified: -1,
            owner: 1
        });
        if (err) {
            discourse.warn('ToDo Startup Error: ' + err);
        }
    });

};

function compile(payload, callback) {
    
    var $ = cheerio.load(payload.$post.cooked);
    
    var lang,
        source,
        input = '';

    var code = $('pre code');
    
    if(code.length === 0)
    {
        callback(null,'http://i1.theportalwiki.net/img/1/17/GLaDOS_escape_02_miscbabble-19.wav \n <!-- no code detected -->');
        return;
    }
    var source = ent.decode(code.html());
    
    
    lang = detetectLanguage(payload, code);
    
    if(lang == undefined)
    {
        callback(null,'http://i1.theportalwiki.net/img/d/d1/GLaDOS_escape_02_spheredestroy3-01.wav \n <!-- no language detected -->');
        return;
    }
    var link = '';
    ideone = new JsonRpcWrapper();
    ideone.call('createSubmission', [config.user, config.pass, source, lang, input, true, false], function (error, result) {
        console.log(result);
        if (result['error'] === 'OK') {
            link = result['link'];
            console.log('link: http://ideone.com/' + link);
            wait(link, callback);
        } else {
            console.log(result['error']);
        }
    });
};

function detectLanguage(payload,code)
{
    if(payload.$arguments[0] === 'langID')
    {
        return payload.$arguments[1];
    }
    else
    {
        var langCode;
        if(payload.$arguments[0] === 'lang')
        {
           langCode = payload.$arguments[1];
        }
        else
        {
            langCode = code.attr('class').split('-')[1];
        }
        var lang;
        Object.keys(languages).forEach(function(index){
            if(languages[index].code == langCode) {
                lang = index;
                return false;
            }

        });
        return lang;
    }
}

function wait(link, callback) {
    ideone = new JsonRpcWrapper();
    ideone.call('getSubmissionStatus', [config.user, config.pass, link], function (error, result) {
        console.log(result);
        if (result['status'] != 0) {
            setTimeout(wait, 1000, link, callback);
        } else {
            details(link, callback);
        }
    });
};

function details(link, callback) {
    ideone = new JsonRpcWrapper();
    ideone.call('getSubmissionDetails', [config.user, config.pass, link, false, false, true, true, true], function (error, result) {
        callback(null, formatResult(result, link));
        console.log(result);
    });
};

function formatResult(result, link)
{
    var tmp = result.output + "<hr>";
    
    if(result.result == 11) //compiler error
    {
        tmp += 'Compiler error!\n\n';
    }
    else if(result.result == 12) //runtime error
    {
        tmp += 'Runtime error!' + result.cmpinfo;
    }
    return tmp + '<hr>' + 
                 'Compiler Info: ' + result.cmpinfo + '\n\n' + 
                 'stderr: ' + result.stderr + '\n\n' + 'link: http://ideone.com/' + link;
}

function listLangs(_, callback) {
    var langList = Object.keys(languages).reduce(function (previous, current) {
        previous += "* [" + current + "] " +
                languages[current].name +
                " - " +
                languages[current].code + '\n';
        return previous;
    }, "");
    callback(null, langList);
};

function supported(_, callback) {

    var supList = Object.keys(languages).reduce(function (previous, current) {
        
        if (languages[current].code !== "") {
            previous += "* [" + languages[current].code + "] " +
                    languages[current].name + '\n';
        }
        return previous;
    }, "");

    callback(null, supList);
};

function challenge(_, callback) {

    var challenge = {
        id: discourse.uuid(),
        input: 'asd',
        output: 'asd'
    };
    var challengesCollection = db.collection("batch_document_insert_collection_safe");
    challengesCollection.insert(challenge);
    
    callback(null, 'challenge created id:'+challenge.id);
};