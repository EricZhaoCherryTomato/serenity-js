import 'mocha';

import { expect } from '@integration/testing-tools';
import { Ensure, equals } from '@serenity-js/assertions';
import { actorCalled } from '@serenity-js/core';
import { by } from 'protractor';

import { Attribute, Hover, Navigate, Target } from '../../../src';
import { pageFromTemplate } from '../../fixtures';

/** @test {Hover} */
describe('Hover', function () {

    const pageWithALink = pageFromTemplate(`
        <html>
            <body style="margin:0; padding:0 0 1024px 0;">
                <h1>A page with a link</h1>
                <a href="javascript:void(0)"
                   class="off"
                   onmouseover="this.className='on';" onmouseout="this.className='off';">link</a>
            </body>
        </html>
    `);

    const Page = {
        Header: Target.the('header').located(by.css('h1')),
        Link:   Target.the('link').located(by.css('a')),
    };

    /** @test {Hover.over} */
    it('allows the actor to position the mouse cursor over a given target', () => actorCalled('Mickey').attemptsTo(
        Navigate.to(pageWithALink),

        Ensure.that(Attribute.of(Page.Link).called('class'), equals('off')),

        Hover.over(Page.Link),
        Ensure.that(Attribute.of(Page.Link).called('class'), equals('on')),

        Hover.over(Page.Header),
        Ensure.that(Attribute.of(Page.Link).called('class'), equals('off')),
    ));

    /** @test {Hover#toString} */
    it('provides a sensible description of the interaction being performed', () => {
        expect(Hover.over(Page.Link).toString())
            .to.equal(`#actor hovers the mouse over the link`);
    });
});
