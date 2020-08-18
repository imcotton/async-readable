/// <reference lib="es2018.asynciterable" />

import { ReadableOptions as Opts, Readable } from 'stream';
import { reader, rejection } from './utils';





export type ReadableStream = Pick<NodeJS.ReadableStream, 'on' | 'off' | 'once' | 'read'>;



export type AsyncReadable = ReturnType<typeof asyncReadable>;

export type Read = AsyncReadable['read'];
export type Off = AsyncReadable['off'];

export type Gen <T> = (readable: AsyncReadable) => AsyncIterable<T>;



export function toAsyncIterable <T> (gen: Gen<T>) {

    return function (source: ReadableStream) {

        return gen(asyncReadable(source));

    };

}



export function toReadableStream <T> (gen: Gen<T>) {

    return function (source: ReadableStream, opts: Opts = { objectMode: true }) {

        return new Readable({
            ...opts,
            read: reader(toAsyncIterable(gen)(source)),
        });

    };

}



export function asyncReadable <T extends Buffer> (stream: ReadableStream) {

    let next = 0;

    /* istanbul ignore next */ // tslint:disable-next-line:no-unused-expression
    let resolve = (chunk: T) => { chunk; };

    const iterator = gen();

    const [ error, reject ] = rejection<T>();



    return { read, off };



    function read (size: number) {

        iterator.next();

        return Promise.race([
            iterator.next(size).then(({ value }) => value as T),
            error,
        ]).catch(e => {
            off();
            throw e;
        });

    }

    function off () {
        stream.off('readable', onReadable);
        stream.off('error', reject);
    }

    async function* gen () {

        stream.on('readable', onReadable);
        stream.once('error', reject);

        while (true) {

            next = yield;

            if (Boolean(next) === false || next < 1) {
                off();
                throw new RangeError(`Invalid size: ${ next }`);
            }

            yield new Promise<T>(res => {
                resolve = res;
                onReadable();
            });

        }

    }

    function onReadable () {

        const data = stream.read(next) as T | null;

        if (data !== null && data !== undefined) {
            next = 0;
            resolve(data);
        }

    }

}

