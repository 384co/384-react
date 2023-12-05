/// <reference types="cypress" />
import * as react384 from '../../../dist/index.js';

context('Snackabra.Store', () => {
    let store;
    beforeEach(() => {
        store = new react384.Snackabra.Store();
    })

    it('console log store and is object', () => {
        console.log('store', store)
        expect(store).to.be.an('object');
    });

})