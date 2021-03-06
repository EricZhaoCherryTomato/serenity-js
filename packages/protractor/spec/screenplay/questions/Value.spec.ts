import 'mocha';

import { Ensure, equals } from '@serenity-js/assertions';
import { actorCalled } from '@serenity-js/core';
import { by } from 'protractor';

import { Navigate, Target, Value } from '../../../src';
import { pageFromTemplate } from '../../fixtures';

describe('Value', () => {

    describe('of', () => {

        /** @test {Text} */
        /** @test {Text.of} */
        it('allows the actor to read the "value" attribute of a DOM element matching the locator', () => actorCalled('Bernie').attemptsTo(
            Navigate.to(pageFromTemplate(`
                <html>
                <body>
                    <form>
                        <input name="username" value="jan-molak" />
                    </form>
                </body>
                </html>
            `)),

            Ensure.that(Value.of(Target.the('username field').located(by.tagName('input'))), equals('jan-molak')),
        ));

        /** @test {Text} */
        /** @test {Text#of} */
        it('allows the actor to read the "value" attribute of a DOM element matching the locator', () => actorCalled('Bernie').attemptsTo(
            Navigate.to(pageFromTemplate(`
                <html>
                <body>
                    <form>
                        <input name="username" value="jan-molak" />
                    </form>
                </body>
                </html>
            `)),

            Ensure.that(Value.of(Target.the('username field').located(by.tagName('input'))), equals('jan-molak')),
        ));

        /** @test {CSSClasses} */
        /** @test {CSSClasses#of} */
        it('allows for a question relative to another target to be asked', () => actorCalled('Bernie').attemptsTo(
            Navigate.to(pageFromTemplate(`
                <html>
                <body>
                    <form>
                        <input name="username" value="jan-molak" />
                    </form>
                </body>
                </html>
            `)),

            Ensure.that(
                Value.of(Target.the('username field').located(by.tagName('input')))
                    .of(Target.the(`form`).located(by.tagName('form'))),
                equals('jan-molak'),
            ),
        ));
    });
});
