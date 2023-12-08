import { _sb_assert } from "./Misc";
// Decorator
export function Memoize(target, propertyKey /* ClassGetterDecoratorContext */, descriptor) {
    if ((descriptor) && (descriptor.get)) {
        let get = descriptor.get;
        descriptor.get = function () {
            const prop = `__${target.constructor.name}__${propertyKey}__`;
            if (this.hasOwnProperty(prop)) {
                const returnValue = this[prop];
                return (returnValue);
            }
            else {
                const returnValue = get.call(this);
                Object.defineProperty(this, prop, { configurable: false, enumerable: false, writable: false, value: returnValue });
                return returnValue;
            }
        };
    }
}
// Decorator
export function Ready(target, propertyKey /* ClassGetterDecoratorContext */, descriptor) {
    if ((descriptor) && (descriptor.get)) {
        let get = descriptor.get;
        descriptor.get = function () {
            const obj = target.constructor.name;
            const prop = `${obj}ReadyFlag`;
            if (prop in this) {
                const rf = "readyFlag";
                _sb_assert(this[rf], `${propertyKey} getter accessed but object ${obj} not ready (fatal)`);
            }
            const retValue = get.call(this);
            _sb_assert(retValue != null, `${propertyKey} getter accessed in object type ${obj} but returns NULL (fatal)`);
            return retValue;
        };
    }
}
