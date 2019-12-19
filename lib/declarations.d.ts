
declare module '*.xml';

declare module 'jaxine';

// These type declaration do not have to be high quality because hey are transient and will be deleted
// once jaxine is replaced by jaxom-ts.
//
declare function buildElement(argumentsNode: Node, parentNode: Node, getOptions: (el: string) => {}): {};
declare function buildElementWithSpec(elementNode: Node, parentNode: Node, spec: {}, getOptions: (el: string) => {}): {};
