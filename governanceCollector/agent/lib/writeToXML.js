var path = require('path');
var fs = require('fs');
var js2xmlparser = require('js2xmlparser');
var config = require("../config/config");
var logger = require("./logger");

var loggerObject = {
    jsFile: "writeToXML.js"
}

function writeToXML(root, type, data, appId, options, morePath) {
    options = options || {
        useCDATA: true,
        declaration: {
            include: false
        }
    };

    morePath = morePath || "";

    try {
        var xmlData = js2xmlparser.parse(root, data, options);
    }
    catch (err) {
        data = replaceInvalidChars(data);
        var xmlData = js2xmlparser.parse(root, data, options);

        //logger.error(err, loggerObject);
        //fs.writeFileSync(path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".err.json"), JSON.stringify(data));
    }
    


    fs.writeFileSync(path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".xml"), xmlData);
    logger.debug("Wrote file: " + path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".xml"), loggerObject);
    return appId + "_" + type + ".xml file saved";
}

function replaceInvalidChars(data) {
    var newData = JSON.stringify(data);

    var propNames = getPropNames(data);
    var propStringCheck = /^[A-Za-z._:][A-Za-z0-9._:]*$/i;
    var propFirstCharCheck = /^[A-Za-z._:]/i;
    var propOtherCharsCheck = /^[A-Za-z0-9._:]*$/i;

    propNames.forEach(function(prop) {
        if (!propStringCheck.test(prop)) {
            var newPropName = prop;

            if (!propOtherCharsCheck.test(prop)) {
                var stringSplit = newPropName.split('');

                stringSplit.forEach(function (char) {
                    if (!propOtherCharsCheck.test(char)) {
                        newPropName = newPropName.replace(char, '_');
                    }
                });
            }

            if (!propFirstCharCheck.test(newPropName)) {
                newPropName = '_' + newPropName;
            }

            newData = newData.replace(prop, newPropName);
            logger.warn(`Invalid XML attribute name detected, replacing ${prop} with ${newPropName}`, loggerObject);
        }
    });

    //fs.writeFileSync(path.join(config.agent.metadataPath, morePath, (appId !== undefined ? appId + "_" : "") + type + ".err.json"), JSON.stringify(propNames));
    return JSON.parse(newData);

    function getPropNames(obj) {
        var result = [];
        for (var prop in obj) {
            var value = obj[prop];

            if (typeof value === 'object') {
                result = result.concat(getPropNames(value));
            }
            else if(!Array.isArray(obj)) {
                result = result.concat(Object.keys(obj));
            }
        }

        // Removes all duplicate prop names before returning
        return Array.from(new Set(result));
    }
}

module.exports = writeToXML;