export const config = {
  components: {
    elm: 'x-elm',
    state: 'x-state',
    text: 'x-text',
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
  BIND = 'x-bind',
  TEXT = 'x-text',
}

export enum ATTRIBUTES {
  VALUE = 'value',
  HIDDEN = 'hidden',
}

export enum API_ATTRIBUTES {
  STATE = '$state',
  ITEM = '$item',
  INDEX = '$index',
  EVENT = '$event',
}
