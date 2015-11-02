import {run} from '@cycle/core';
import {h, makeDOMDriver, svg} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {integer, sampler} from 'jsverify';
import lightness from 'lightness';
import {chain, map, pipe, prepend} from 'ramda';
import {Observable} from 'rx';
import combineLatestObj from 'rx-combine-latest-obj';
import {vegaParseSpec} from 'rx-vega-parse';
import {fromHTML} from 'vdom-virtualize';

const Bar = (max, width) => (value, i) =>
  svg('rect',
    {
      height: `${value / max * 100}%`,
      width: `${width}%`,
      x: `${i * width}`,
    },
    [ svg('title', [value])]
  )

const BarChart = values => {
  const max = Math.max.apply(null, values);
  return svg(
    'svg',
    {baseProfile: 'full', height: '100', width: '100', version: '1.1'},
    [ svg('style',
        `
          rect:hover {
            opacity: 0.5;
          }
        `)
    , svg('g', {fill: 'blue', transform: 'translate(0, 100) scale(1, -1)'},
        values.map(Bar(max, 100 / values.length))
      )
    ]
  )
}

const Line = width => (value, i) => `L ${i * width} ${value}`;

const foo = f => (width, values) => values.map(f(width));

const lines = foo(Line);

const vert = width => (value, i) =>
  svg('path', {d: `M ${i * width} 0 V ${value}`})

const verts = (width, values) =>
  svg('g', {stroke: 'blue'}, foo(vert)(width, values));

const top = width => (value, i) => `L ${i * width} ${value}`

const topLine = (stroke, width, values) => {
  if (values.length) {
    return svg('path', {
      d: `M 0 ${values[0]} ${values.map(top(width))}`,
      'fill-opacity': '0',
      stroke: stroke,
    });
  } else {
    return '';
  }
}

const LineChart = opts => values => {
  const fill = opts.fill || 'blue';
  const height = opts.height || '100';
  const width = opts.width || '100';

  const lineWidth = width / values.length;
  const max = Math.max.apply(null, values);
  const maximized = map(v => v / max * height, values);
  const adjusted = maximized.length ? prepend(maximized[0], maximized): [];

  return svg(
    'svg',
    {baseProfile: 'full', height: height, width: width, version: '1.1'},
    [ svg('style',
        `
          path:hover {
            opacity: 1;
          }
        `)
    , svg('g', {fill: fill, transform: `translate(0, ${height}) scale(1, -1)`},
        [ svg('path', {
            d: `M 0 0 ${lines(lineWidth, adjusted)} V 0 Z`
          })
        , topLine(lightness(fill, -65), lineWidth, adjusted)
        ].concat(verts(lineWidth, []))
      )
    ]
  )
}

const DonutChart = opts => values => {
  const fill = opts.fill || 'blue';
  const height = opts.height || '100';
  const width = opts.width || '100';

  return svg(
    'svg',
    {baseProfile: 'full', height: height, width: width, version: '1.1'},

  );
}

const MyLineChart = LineChart({
  height: '200',
  fill: '#baddad',
  width: '300',
});

const intent = HTTP => {
  const n = Observable.interval(1000);
  const barSVG = HTTP.filter(res => res.request === '/bar.svg').mergeAll();
  const spec = HTTP.filter(res => res.request === '/spec.json').mergeAll();

  return combineLatestObj({n, barSVG, spec});
}

const model = intent$ =>
  intent$.flatMap(({n, barSVG, spec}) =>
    vegaParseSpec(spec.body).map(chart => ({n, barSVG, chart}))
  ).map(({n, barSVG, chart}) => ({
    vals: sampler(integer(10, 60))(Math.min(15, n)),
    barSVG: barSVG.text,
    strSVG: chart({renderer: 'svg'}).update().svg(),
  }));

const view = map(({vals, barSVG, strSVG}) =>
  h('div', [
    h('div', BarChart(vals)),
    h('div', MyLineChart(vals)),
    h('div', fromHTML(barSVG)),
    h('div', fromHTML(strSVG)),
  ])
);

function main({DOM, HTTP}) {
  return {
    DOM: view(model(intent(HTTP))),
    HTTP: Observable.merge(
      Observable.return('/bar.svg'),
      Observable.return('/spec.json')
    ),
  };
}

const drivers = {
  DOM: makeDOMDriver('#content'),
  HTTP: makeHTTPDriver(),
};

run(main, drivers);
