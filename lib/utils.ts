/// <reference lib="es2018.asynciterable" />

import { Readable } from 'stream';





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



export function rejection () {

    /* istanbul ignore next */ // tslint:disable-next-line:no-unused-expression
    let reject = (error: Error) => { error; };

    const error = new Promise((_res, rej) => reject = rej);

    return [ error, reject ] as const;

}

