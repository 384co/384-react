/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// import { mount } from 'cypress/react'
// import { MemoryRouter } from 'react-router-dom'
// import { MountOptions, MountReturn } from 'cypress/react'
// import { MemoryRouterProps } from 'react-router-dom'

// declare global {
//   namespace Cypress {
//     interface Chainable {
//       /**
//        * Mounts a React node
//        * @param component React Node to mount
//        * @param options Additional options to pass into mount
//        */
//       mount(
//         component: React.ReactNode,
//         options?: MountOptions & { routerProps?: MemoryRouterProps }
//       ): Cypress.Chainable<MountReturn>
//     }
//   }
// }

// Cypress.Commands.add('mount', (component, options = {}) => {
//   const { routerProps = { initialEntries: ['/'] }, ...mountOptions } = options

//   const wrapped = <MemoryRouter {...routerProps}>{component}</MemoryRouter>

//   return mount(wrapped, mountOptions)
// })
//@ts-ignore
// Cypress.Commands.add('waitForLocalStorage', (key: string, expectedValue: string, timeout: number) => {
//     return cy
//         .window({ timeout: timeout })
//         .then({ timeout: timeout }, (win) => {
//             return new Cypress.Promise((resolve, reject) => {
//                 const checkLocalStorage = () => {
//                     const actualValue = win.localStorage.getItem(key);
//                     console.log(actualValue)
//                     if (actualValue === expectedValue) {
//                         resolve();
//                     } else {
//                         setTimeout(checkLocalStorage, 100);
//                     }
//                 };

//                 setTimeout(() => {
//                     reject(`Timed out waiting for localStorage.${key} to be ${expectedValue}`);
//                 }, timeout);

//                 checkLocalStorage();
//             });
//         })
// });

import { faker } from '@faker-js/faker';

Cypress.Commands.add('generateFakeUsers', (count: number) => {
    const fakeUsers: {password: string, email: string} = [];

    for (let i = 0; i < count; i++) {
        const fakeEmail = faker.internet.email();
        const fakePassword = faker.internet.password({ length: 20 })
        const fakeFullName = faker.person.fullName()
        const fakeBirthDate = faker.date.past()
        const fakePhoneNumber = faker.phone.number()
        const fakeStreetAddress = faker.location.streetAddress()
        const fakeCity = faker.location.city()
        const fakeState = faker.location.state()
        const fakeZipCode = faker.location.zipCode()
        const fakeCountry = faker.address.country()

        // You can add more data fields as needed

        const fakeUser = {
            email: fakeEmail,
            password: fakePassword,
            fullName: fakeFullName,
            birthDate: fakeBirthDate,
            phoneNumber: fakePhoneNumber,
            streetAddress: fakeStreetAddress,
            city: fakeCity,
            state: fakeState,
            zipCode: fakeZipCode,
            country: fakeCountry,
            // Add more fields here if needed
        };

        fakeUsers.push(fakeUser);
    }

    return fakeUsers;
});

Cypress.Commands.add('generateFakeCustomInputFields', (count: number) => {
    const fakeInputs: string[] = [];

    for (let i = 0; i < count; i++) {

        fakeInputs.push(faker.lorem.words({ min: 1, max: 3 }));
    }

    return fakeInputs;
});

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false
  })