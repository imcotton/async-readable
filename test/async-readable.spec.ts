import { Readable } from 'stream';

import { mirror } from 'proxy-bind';

import { asyncReadable, toReadableStream, AsyncReadable } from '../lib/async-readable';





describe('AsyncReadable', () => {

    const source = Buffer.from([ 1, 2, 3, 4, 5 ]);

    let read: (size: number) => Promise<Buffer>;



    beforeEach(() => {

        const [ readable, { push } ] = mirror(new Readable({ read () {} }));

        read = asyncReadable(readable).read;

        push(source.slice(0, 2));

        setTimeout(() => push(source.slice(2)), 10);

    });



    test('async', async () => {

        const [ three, two ] = await Promise.all([ read(3), read(2) ]);

        expect(three.length).toBe(3);
        expect(two.length).toBe(2);

        expect(Buffer.concat([ three, two ])).toEqual(source);

    });

    test.each([ NaN, 0, -1 ])('err: %p', size => {

        expect(read(size)).rejects.toThrowError(RangeError);

    });

});



describe('toReadableStream', () => {

    const source = Buffer.from([ 1, 2, 3, 4, 5 ]);

    const readable = new Readable({
        read () {
            this.push(source);
            this.push(null);
        },
    })

    const gen = async function* ({ read }: AsyncReadable) {
        yield read(3);
        yield read(2);
    };

    const stream = toReadableStream(gen)(readable);

    test('', async () => {

        const list = [];

        for await (const item of stream) {
            list.push(item);
        }

        expect(Buffer.concat(list)).toEqual(source);

    });

});



describe('back-pressure', () => {

    const source = Buffer.allocUnsafe(1000);

    const readable = new Readable({

        read () {
            this.push(source);
            this.push(null);
        },

    })

    const gen = async function* ({ read }: AsyncReadable) {
        while (true) {
            yield read(1);
        }
    };

    const stream = toReadableStream (gen) (readable, { highWaterMark: 1 });

    test('', done => {

        stream.once('readable', () => {

            if (stream.read() != null) {
                done();
            }

        });

        stream.read(1);

    });

});

