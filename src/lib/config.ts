export const config = {
  components: {
    elm: 'x-elm',
    state: 'x-state',
    var: 'x-var',
    for: 'x-for',
    if: 'x-if',
  },
  state: {
    readyEvent: 'state-ready',
    nested: 'data-state-nested',
  },
};

export enum RESERVED_ATTRIBUTES {
  AS = 'as',
  FOREACH = 'each',
  VALUE = 'x-value',
  BIND = 'x-bind',
}

export enum API_ATTRIBUTES {
  STATE = '$state',
  ITEM = '$item',
  INDEX = '$index',
  EVENT = '$event',
}
