/// <reference lib="es2018.asynciterable" />

import { Readable } from 'stream';





export type ReadableStream = Pick<NodeJS.ReadableStream, 'on' | 'off' | 'read'>;



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

    return function (source: ReadableStream) {

        return new Readable({
            objectMode: true,
            read: reader(toAsyncIterable(gen)(source)),
        });

    };

}



export function reader <T> (source: AsyncIterable<T>, destroy = () => { }) {

    const iterator = source[Symbol.asyncIterator]();

    let reading = false;

    return async function (this: Readable) {

        if (reading) {
            return;
        }

        reading = true;

        try {

            while (true) {

                const { value, done } = await iterator.next();

                if (done) {
                    break;
                }

                if (this.push(value) === false) {
                    reading = false;
                    return;
                }

            }

            this.push(null);

        } catch (error) {
            destroy();
            this.destroy(error);
        }

    };

}



export function asyncReadable <T extends Buffer> (stream: ReadableStream) {

    let next = 0;

    /* istanbul ignore next */ // tslint:disable-next-line:no-unused-expression
    let resolve = (chunk: T) => { chunk; };

    const iterator = gen();



    return Object.freeze({
        read,
        off,
    });



    function read (size: number) {

        iterator.next();

        return iterator.next(size).then(({ value }) => value as T);

    }

    function off () {
        stream.off('readable', onReadable);
    }

    async function* gen () {

        stream.on('readable', onReadable);

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

