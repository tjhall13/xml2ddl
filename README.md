# xml2ddl

xml2ddl converts an xml schema to a sql data description language. It supports mysql syntax and both primary key and foreign key constraints.

# Installation

Install using npm with ```sh npm install xml2ddl ```.

# Usage

xml2ddl exports a single function that takes a filename to read xml from and calls a callback with an array of sql commands.

```javascript
var xml2ddl = require('xml2ddl');

xml2ddl(filename, [syntax = 'mysql',] callback);

```

## Example

```javascript
var xml2ddl = require('xml2ddl');

xml2ddl('myschema.xml', 'mysql', function(err, data) {
    if(err) {
        console.log(err);
    } else {
        data.forEach(function(command) {
            console.log(command);
        });
    }
});

```
