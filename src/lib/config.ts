export const config = {
  components: {
    reactive: 'x-reactive',
    elm: 'x-elm',
    state: 'x-state',
    var: 'x-var',
    for: 'x-for',
  },
};

export enum RESERVED_ATTRIBUTES {
  IF = 'x-if',
  SHOW = 'x-show',
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
