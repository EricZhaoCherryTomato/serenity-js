import { Artifact, JSONData, Photo } from '../../src/model';
import { expect } from '../expect';

describe ('Artifact', () => {
    describe('Photo', () => {

        const photo = Photo.fromBase64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEW01FWbeM52AAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==');

        /** @test {Photo#toJSON} */
        it('can be serialised', () => {
            const serialised = photo.toJSON();

            expect(serialised.type).to.equal('Photo');
            expect(serialised.base64EncodedValue).to.equal(photo.base64EncodedValue);
        });

        /**
         * @test {Photo#toJSON}
         * @test {Artifact.fromJSON}
         */
        it('can be de-serialised', () => {
            const
                serialised = photo.toJSON(),
                deserialised = Artifact.fromJSON(serialised);

            expect(deserialised).to.equal(photo);
        });

        /**
         * @test {Photo#map}
         * @test {Photo#base64EncodedValue}
         */
        it('allows for its value to be extracted as a Buffer', () => {
            photo.map(value => expect(value).to.be.instanceOf(Buffer));
            photo.map(value => expect(value.toString('base64')).to.equal(photo.base64EncodedValue));
        });

        /**
         * @test {Photo.fromBuffer}
         */
        it('can be instantiated from a Buffer', () => {
            expect(Photo.fromBuffer(Buffer.from(photo.base64EncodedValue, 'base64'))).to.equal(photo);
        });
    });

    describe('JSONData', () => {

        const json = JSONData.fromJSON({
            key: ['v', 'a', 'l', 'u', 'e'],
        });

        /** @test {JSONData#toJSON} */
        it('can be serialised', () => {
            const serialised = json.toJSON();

            expect(serialised.type).to.equal('JSONData');
            expect(serialised.base64EncodedValue).to.equal(json.base64EncodedValue);
        });

        /**
         * @test {JSONData#toJSON}
         * @test {Artifact.fromJSON}
         */
        it('can be de-serialised', () => {
            const
                serialised = json.toJSON(),
                deserialised = Artifact.fromJSON(serialised);

            expect(deserialised).to.equal(json);
        });

        /**
         * @test {JSONData#map}
         * @test {JSONData#base64EncodedValue}
         */
        it('allows for its value to be extracted as a JSON value', () => {
            json.map(value => expect(value).to.be.instanceOf(Object));
            json.map(value => expect(value).to.deep.equal({
                key: ['v', 'a', 'l', 'u', 'e'],
            }));
        });
    });
});
