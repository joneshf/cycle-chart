import {run} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {map, propEq} from 'ramda';
import {Observable} from 'rx';
import {vegaParseSpec} from 'rx-vega-parse';
import {fromHTML} from 'vdom-virtualize';

const intent = HTTP => HTTP.filter(propEq('request', '/spec.json')).mergeAll();

const model = intent$ => intent$
  .pluck('body')
  .flatMap(vegaParseSpec)
  .map(chart => chart({renderer: 'svg'}).update().svg());

const view = map(fromHTML);

function main({HTTP}) {
  return {
    DOM: view(model(intent(HTTP))),
    HTTP: Observable.return('/spec.json'),
  };
}

const drivers = {
  DOM: makeDOMDriver('#content'),
  HTTP: makeHTTPDriver(),
};

run(main, drivers);
