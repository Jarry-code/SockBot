'use strict';
var async = require('async'),
        fs = require('fs'),
        yml = require('js-yaml'),
        rpc = require('./compiler/jsonrpc'),
        cheerio = require('cheerio');
var errors,
        languages,
        config,
        user, pass,
        JsonRpcWrapper,
        ideone;

exports.name = 'Compiler';
exports.version = '0.1.2';
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
    }
};

exports.begin = function begin(_, c) {
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
    var source = code.html();
    var langCode = code.attr('class').split('-')[1];
    console.log(langCode);

    Object.keys(languages).forEach(function(index){
        if(languages[index].code == langCode) {
            lang = index;
            return false;
        }
            
    });
    
    if(lang == undefined)
    {
        callback(null,'http://i1.theportalwiki.net/img/1/17/GLaDOS_escape_02_miscbabble-19.wav \n <!-- no language detected -->');
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
    return result.output + '\n' + 'link: http://ideone.com/' + link;
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