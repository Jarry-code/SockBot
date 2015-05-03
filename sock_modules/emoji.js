/**
 * MobileEmoji module. Responsible for automatically replacing emoji with Discourse emoji codes
 * @module emoji
 */
'use strict';
var discourse,
    configuration;

var emojiLookup = {
    //Miscellaneous Symbols block (U+2600–U+26FF)
    '☹': ':worried:',
    '☺': ':smile:',
    '☻': ':smile:',
    //Emoticons block (U+1F600-U+1F64F)
    '😀': ':grinning:',
    '😁': ':smiley:',
    '😂': ':joy:',
    '😃': ':smile:',
    '😄': ':smile:',
    '😅': ':sweat_smile:',
    '😆': ':laughing:',
    '😇': ':innocent:',
    '😈': ':smiling_imp:',
    '😉': ':wink:',
    '😊': ':smile:',
    '😋': ':stuck_out_tongue:',
    '😌': ':relieved:',
    '😍': ':heart_eyes:',
    '😎': ':sunglasses:',
    '😏': ':smirk:',
    '😐': ':neutral_face:',
    '😑': ':expressionless:',
    '😒': ':unamused:',
    '😓': ':cold_sweat:',
    '😔': ':pensive:',
    '😕': ':confused:',
    '😖': ':confounded:',
    '😗': ':kissing:',
    '😘': ':kissing:',
    '😙': ':kissing_smiling_eyes:',
    '😚': ':kissing_closed_eyes:',
    '😛': ':stuck_out_tongue:',
    '😜': ':stuck_out_tongue_winking_eye:',
    '😝': ':stuck_out_tongue_closed_eyes:',
    '😞': ':disappointed:',
    '😟': ':worried:',
    '😠': ':angry:',
    '😡': ':person_with_pouting_face:',
    '😢': ':cry:',
    '😣': ':persevere:',
    '😤': ':triumph:',
    '😥': ':disappointed_relieved:',
    '😦': ':frowning:',
    '😧': ':anguished:',
    '😨': ':fearful:',
    '😩': ':weary:',
    '😪': ':sleepy:',
    '😫': ':tired_face:',
    '😬': ':grimacing:',
    '😭': ':sob:',
    '😮': ':open_mouth:',
    '😯': ':hushed:',
    '😰': ':sweat_smile:',
    '😱': ':scream:',
    '😲': ':astonished:',
    '😳': ':flushed:',
    '😴': ':sleeping:',
    '😵': ':dizzy_face:',
    '😶': ':no_mouth:',
    '😷': ':mask:',
    '😸': ':smiley_cat:',
    '😹': ':joy_cat:',
    '😺': ':smile_cat:',
    '😻': ':heart_eyes_cat:',
    '😼': ':smirk_cat:',
    '😽': ':kissing_cat:',
    '😾': ':pouting_cat:',
    '😿': ':crying_cat_face:',
    '🙀': ':weary:',
    '🙁': ':frowning:',
    '🙂': ':smile:',
    '🙅': ':no_good:',
    '🙆': ':ok_woman:',
    '🙇': ':bow:',
    '🙈': ':see_no_evil:',
    '🙉': ':hear_no_evil:',
    '🙊': ':speak_no_evil:',
    '🙋': ':raising_hand:',
    '🙌': ':raising_hand:',
    '🙍': ':person_frowning:',
    '🙎': ':person_with_pouting_face:',
    '🙏': ':pray:'
};

/** Description of the module */
exports.description = 'Automatically replace emoji with Discourse emoji codes';

/** 
 * Configuration properties.
 * @property enabled - Whether to use MobileEmoji or not. Defaults to false.
 */
exports.configuration = {
    enabled: false
};

/** Name of the module */
exports.name = 'MobileEmoji';

/** Priority of the module */
exports.priority = undefined;

/** Module version */
exports.version = '0.3.0';

var fullName = exports.name + ' ' + exports.version;

/**
 * Bootstrap the module.
 * @param {object} browser - The Discourse interface object
 * @param {object} config - The SockBot config object
 */
exports.begin = function begin(browser, config) {
    discourse = browser;
    configuration = config.modules[exports.name];
};

/**
 * Register the required listeners.
 * @param {function} callback - The callback to use once the action is complete
 */
exports.registerListeners = function registerListeners(callback) {
    if (configuration.enabled) {
        callback(null, ['/latest']);
    } else {
        callback();
    }
};

/**
 * Handle received messages.
 * @param {object} message - An object representing the message that was received
 * @param {object} post - An object representing the post that the message was about
 * @param {function} callback - The callback to use once the action is complete
 */
exports.onMessage = function onMessage(message, post, callback) {
    if (message.data && message.data.topic_id
        && message.data.message_type === 'latest') {
        discourse.getLastPosts(message.data.topic_id, function (post2, flow) {
            if (post2.yours) {
                var original = post2.raw;
                var raw = post2.raw;

                for (var emoji in emojiLookup) {
                    raw = raw.replace(emoji, emojiLookup[emoji]);
                }
                discourse.log('Emoji in post ' + post2.id + ' replaced');

                if (original !== raw) {
                    discourse.editPost(post2.id, raw, fullName, function () {
                        flow(null, true);
                    });
                } else {
                    flow(null, true);
                }
            } else {
                flow();
            }
        }, function () {
            callback();
        });
    } else {
        callback();
    }
};
