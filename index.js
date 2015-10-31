var xml2js = require('xml2js');

var fs = require('fs');
var path = require('path');

function generateDDL(data, options, callback) {
    var syntax = options.syntax;
    var prefix = options.prefix;
    if(!prefix) {
        prefix == '';
    }
    if(syntax != 'mysql') {
        callback('unsupported sql syntax', null);
    } else {
        var database = data.database;
        
        var ddl = [];
        var entry, rule;
        
        var keys, reference;
        var name;
        
        try {
            database['table'].forEach(function(table) {
                if(table.$.name) {
                    name = prefix + table.$.name;
                } else {
                    throw new Error('no table name provided');
                }
                keys = [];
                entry = 'CREATE TABLE ' + name + ' (';
                
                if(!table['column']) {
                    table['column'] = [];
                }
                if(!table['foreign-key']) {
                    table['foreign-key'] = [];
                }
                if(!table['row']) {
                    table['row'] = [];
                }
                
                table['column'].forEach(function(column) {
                    rule = column.$.name;
                    
                    rule = rule.concat(' ', column.$.type);
                    
                    switch(column.$.type.toLowerCase()) {
                        case 'text':
                        case 'blob':
                        case 'varchar':
                            if(column.$.charset) {
                                rule = rule.concat(' CHARSET ', column.$.charset)
                            }
                            if(column.$.colate) {
                                rule = rule.concat(' COLLATE ', column.$.collate);
                            }
                            break;
                    }
                    
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
                    
                    if(column.$.default) {
                        rule = rule.concat(' ', 'DEFAULT "' + column.$.default + '"');
                    }
                    
                    entry = entry.concat(rule, ',');
                });
                
                table['foreign-key'].forEach(function(key) {
                    rule = { type: 'foreign' };
                    rule.table = prefix + key.$.foreignTable;
                    
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
                
                ddl.unshift('DROP TABLE IF EXISTS ' + name + ';');
                ddl.push(entry);
                
                table['row'].forEach(function(row) {
                    if(!row['field']) {
                        row['field'] = [];
                    }
                    
                    var fields = row['field'].reduce(function(entry, field) {
                        entry[0] += "," + field.$.column;
                        entry[1] += ",'" + field._ + "'";
                        return entry;
                    }, ['', '']);
                    
                    entry = 'INSERT INTO ' + name + ' (' + fields[0].substr(1) + ')' + ' VALUES ' + '(' + fields[1].substr(1) + ');';
                    ddl.push(entry);
                });
            });
            callback(null, ddl);
        } catch(e) {
            callback(e, null);
        }
    }
}

function parseXML(filename, options, callback) {
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
                    generateDDL(result, options, callback);
                }
            });
        }
    });
}

module.exports = function(filename, options, callback) {
    if(!filename || typeof filename != 'string') {
        throw 'filename must be string';
    }
    
    if(!callback) {
        switch(typeof options) {
            case 'function':
                callback = options;
                options = {
                    syntax: 'mysql',
                    prefix: ''
                };
                break;
            default:
                throw 'no callback function provided';
        }
    } else {
        if(typeof callback != 'function') {
            throw 'callback must be a function';
        } else if(typeof options != 'object') {
            throw 'options must be a object';
        }
    }
    
    parseXML(filename, options, callback);
};
