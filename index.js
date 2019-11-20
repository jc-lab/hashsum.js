#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');

let arg_algorithm;
let arg_tag = false;
let arg_out_file;
let arg_in_file;
let arg_binary = false;

const arg_options = [
    {
        name: '--algo',
        type: 1,
        func: (v) => arg_algorithm = v
    },
    {
        name: '--out-file',
        type: 1,
        func: (v) => arg_out_file = v
    },
    {
        name: '--tag',
        type: 0,
        func: (v) => arg_tag = true
    },
    {
        name: '--binary',
        type: 0,
        func: (v) => arg_binary = true
    },
    {
        name: '-b',
        type: 0,
        func: (v) => arg_binary = true
    },
    {
        name: '--text',
        type: 0,
        func: (v) => arg_binary = false
    },
    {
        name: '-t',
        type: 0,
        func: (v) => arg_binary = false
    }
];

for(var i = 0; i < process.argv.length; i++) {
    const item = process.argv[i];
    let handled = false;
    for (var opt of arg_options) {
        if (item.startsWith(opt.name)) {
            handled = true;
            if (item == opt.name) {
                if (opt.type == 1) {
                    i++;
                    opt.func(process.argv[i]);
                } else {
                    opt.func(true);
                }
            } else if (item.startsWith(opt.name + '=')) {
                opt.func(item.substr(opt.name.length + 1));
            }
        }
    }
    if(!handled) {
        arg_in_file = item;
    }
}

const mode_char = arg_binary ? '*' : ' ';

const hash = crypto.createHash(arg_algorithm);
const fis = fs.createReadStream(arg_in_file);
fis.on('data', (data) => {
    hash.update(data);
});
fis.on('error', (err) => {
    try {
        fis.close();
    } finally {
        console.error(err);
        process.exit(1);
    }
});
fis.on('end', () => {
    fis.close();
    const digestRaw = hash.digest();
    const digestHex = digestRaw.toString('hex');
    let output;
    if(arg_tag) {
        output = arg_algorithm.toUpperCase() + " (" + arg_in_file + ") = " + digestHex;
    }else{
        output = digestHex + " " + mode_char + arg_in_file;
    }
    console.log(output);
    if(arg_out_file) {
        fs.writeFile(arg_out_file, output, (err) => {
            if(err) {
                console.error(err);
                process.exit(1);
            }
        });
    }
});
