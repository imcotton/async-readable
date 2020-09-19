async-readable
==============

[![npm version](https://badgen.net/npm/v/async-readable)](https://www.npmjs.com/package/async-readable)
[![actions](https://github.com/imcotton/async-readable/workflows/Check/badge.svg)](https://github.com/imcotton/async-readable/actions)
[![codecov](https://codecov.io/gh/imcotton/async-readable/branch/master/graph/badge.svg)](https://codecov.io/gh/imcotton/async-readable)

Utils for reading streams asynchronously in paused mode (pull stream).





How to Use
----------

### Basic

```javascript
const { createReadStream } = require('fs');
const { asyncReadable } = require('async-readable');

async function parse_GIF_size (path) {

    const { read } = asyncReadable(createReadStream(path));

    const [ G, I, F ] = await read(3);
    const [ EIGHT, SEVEN_OR_NINE, A ] = await read(3);

    const width = (await read(2)).readUInt16LE(0);
    const height = (await read(2)).readUInt16LE(0);

    return { width, height };

}

parse_GIF_size('./sample.gif').then(console.log, console.error);
```





### Advanced

_assuming to have_

```javascript
const { connect } = require('net');

const socket = connect({ host: 'localhost', port: 8080 });

async function* process ({ read }) {

    while (true) {
        const head = await read(2);
        const size = head.readUInt16LE(0);
        yield read(size);
    }

}
```

_hence_

```javascript
const { toAsyncIterable } = require('async-readable');

const unpack = toAsyncIterable(process);

async function run () {

    for await (const frame of unpack(socket)) {
        // ...
    }

}
```

_or_

```javascript
const { toReadableStream } = require('async-readable');

const unpack = toReadableStream(process);

function run () {

    const stream = unpack(socket);

    stream.on('data', frame => {
        // ...
    });

}
```





License
-------

the MIT

