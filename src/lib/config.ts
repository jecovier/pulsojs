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
  AS = 'data-as',
  IF = 'data-if',
  SHOW = 'data-show',
  FOREACH = 'data-foreach',
  VALUE = 'data-value',
  BIND = 'data-bind',
}

export enum API_ATTRIBUTES {
  STATE = '$state',
  ITEM = '$item',
  INDEX = '$index',
  EVENT = '$event',
}
