import { Readable, pipeline, PassThrough } from 'stream';

import { asyncReadable, AsyncReadable } from '../lib/async-readable';
import { reader } from '../lib/utils';





describe('reader', () => {

    const source = Buffer.from([ 1, 2, 3, 4, 5 ]);

    const readable = new Readable({

        highWaterMark: 1,

        read () {
            this.push(source);
            this.push(null);
        },

    });

    class Oops extends Error {}

    const gen = async function* ({ read }: AsyncReadable) {
        yield* await Promise.all([ read(1), read(1), read(1) ]);
        yield read(1);
        throw new Oops();
        yield read(1);
    };


    test('error w/ destroy', done => {

        const fn = jest.fn();

        const stream = new Readable({
            objectMode: false,
            read: reader(gen(asyncReadable(readable)), fn),
        });

        pipeline(stream, new PassThrough(), error => {

            expect(fn).toHaveBeenCalled();
            expect(error).toBeInstanceOf(Oops);

            done();

        });

    });

    test('double reading w/ destroy', async () => {

        const push = jest.fn();
        const destroy = jest.fn();

        const shell = { push, destroy } as unknown as Readable;

        const readable = new Readable({

            read () {
                this.push(Buffer.allocUnsafe(10));
                this.push(null);
            },

        });

        const gen = async function* ({ read }: AsyncReadable) {
            yield read(1);
            throw 'wat';
        };

        const read = reader(gen(asyncReadable(readable)));

        const [ a, b ] = await Promise.all([
            read.call(shell),
            read.call(shell),
        ]);

        expect(a).toEqual(b);
        expect(b).toBeUndefined();
        expect(push).toHaveBeenCalled();
        expect(destroy).toHaveBeenCalledWith('wat');

    });

});

