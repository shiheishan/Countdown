export const elements = {
  digits: {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('mins'),
    seconds: document.getElementById('secs'),
  },
  meta: {
    pct: document.getElementById('pct'),
    fill: document.getElementById('fill'),
    elapsed: document.getElementById('elapsed'),
    remain: document.getElementById('remain'),
    total: document.getElementById('total'),
  },
  labels: {
    start: document.getElementById('startLabel'),
    end: document.getElementById('endLabel'),
  },
  statusBadge: document.getElementById('statusBadge'),
  ring: {
    arc: document.getElementById('arc'),
    head: document.getElementById('arcHead'),
    pct: document.getElementById('ringPct'),
    state: document.getElementById('ringState'),
  },
  theme: {
    button: document.getElementById('btn-theme'),
    popover: document.getElementById('pop'),
    list: document.getElementById('themeList'),
  },
  pageTitle: document.getElementById('pageTitle'),
  drawer: {
    root: document.getElementById('drawer'),
    backdrop: document.getElementById('backdrop'),
    button: document.getElementById('btn-drawer'),
  },
  panel: {
    sunValue: document.getElementById('sunValue'),
    sunDesc: document.getElementById('sunDesc'),
    octValue: document.getElementById('octValue'),
    octDesc: document.getElementById('octDesc'),
  },
};
