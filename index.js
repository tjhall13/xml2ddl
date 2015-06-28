var xml2js = require('xml2js');

var fs = require('fs');
var path = require('path');

function generateDDL(data, syntax, callback) {
    if(syntax != 'mysql') {
        callback('unsupported sql syntax', null);
    } else {
        var database = data.database;
        
        var ddl = [];
        var entry, rule;
        
        var keys, reference;
        
        database['table'].forEach(function(table) {
            keys = [];
            entry = 'CREATE TABLE ' + table.$.name + '(';
            
            if(!table['column']) {
                table['column'] = [];
            }
            if(!table['foreign-key']) {
                table['foreign-key'] = [];
            }
            
            table['column'].forEach(function(column) {
                rule = column.$.name;
                
                rule = rule.concat(' ', column.$.type);
                
                if(column.$.size) {
                    rule = rule.concat('(', column.$.size, ')');
                }
                
                if(column.$.autoIncrement) {
                    rule = rule.concat(' ', 'AUTO_INCREMENT');
                }
                
                if(column.$.primaryKey) {
                    keys.push({
                        type: 'primary',
                        column: column.$.name
                    });
                } else {
                    if(column.$.required) {
                        rule = rule.concat(' ', 'NOT NULL');
                    }
                    
                    if(column.$.unique) {
                        rule = rule.concat(' ', 'UNIQUE');
                    }
                }
                
                entry = entry.concat(rule, ',');
            });
            
            table['foreign-key'].forEach(function(key) {
                rule = { type: 'foreign' };
                rule.table = key.$.foreignTable;
                
                reference = key['reference'][0];
                rule.local = reference.$.local;
                rule.foreign = reference.$.foreign;
                
                keys.push(rule);
            });
            
            keys.forEach(function(key) {
                if(key.type == 'primary') {
                    rule = 'PRIMARY KEY(' + key.column + ')';
                } else if(key.type == 'foreign') {
                    rule = 'FOREIGN KEY(' + key.local + ')';
                    rule = rule.concat(' REFERENCES ', key.table, '(', key.foreign, ')');
                }
                
                entry = entry.concat(rule, ',');
            });
            
            entry = entry.substr(0, entry.length - 1).concat(');');
            
            ddl.unshift('DROP TABLE IF EXISTS ' + table.$.name + ';');
            ddl.push(entry);
        });
        
        callback(null, ddl);
    }
}

function parseXML(filename, syntax, callback) {
    var filepath;
    filepath = path.resolve(filename);
    
    fs.readFile(filepath, function(err, data) {
        if(err) {
            callback(err, null);
        } else {
            xml2js.parseString(data, function(err, result) {
                if(err) {
                    callback(err, null);
                } else {
                    generateDDL(result, syntax, callback);
                }
            });
        }
    });
}

module.exports = function(filename, syntax, callback) {
    if(!filename || typeof filename != 'string') {
        throw 'filename must be string';
    }
    
    if(!callback) {
        switch(typeof syntax) {
            case 'function':
                callback = syntax;
                syntax = 'mysql';
                break;
            default:
                throw 'no callback function provided';
        }
    } else {
        if(typeof callback != 'function') {
            throw 'callback must be a function';
        } else if(typeof syntax != 'string') {
            throw 'syntax must be a string';
        }
    }
    
    parseXML(filename, syntax, callback);
};
