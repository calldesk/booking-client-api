/* eslint-env mocha */
// @flow
'use strict';
const moment = require('moment-timezone');
const expect = require('chai').expect;
const getNextSlots = require('../src/util').getNextSlots;

const CALENDAR = [
  [], // M (closed)
  [{start: '09:00', end: '18:00', duration: 30, prob: 1}],  // T
  [{start: '09:00', end: '18:00', duration: 60, prob: 1}],  // W
  [],
  [],
  [],
  []
];

describe('getNextSlots', () => {
  it('should return no slot on monday', () => {
    const start = '2016-06-20T11:00:00+02:00'; // monday
    const end = moment(start).add(3, 'h');
    const slots = getNextSlots(start, end, CALENDAR);
    expect(slots.length).to.equal(0);
  });
  it('should find 18 slots on Tuesday', () => {
    const start = '2016-06-21T09:00:00+02:00'; // tuesday
    const end = '2016-06-21T18:00:00+02:00';
    const slots = getNextSlots(start, end, CALENDAR);
    expect(slots.length).to.equal(18);
  });
  it('should find 9 slots on wednesday', () => {
    const start = '2016-06-22T09:00:00+02:00';
    const end = '2016-06-22T20:00:00+02:00';
    const slots = getNextSlots(start, end, CALENDAR);
    expect(slots.length).to.equal(9);
  });
  it('should find 15 slots between T@14:00 and W@16:30', () => {
    const start = '2016-06-21T14:00:00+02:00';
    const end = '2016-06-22T16:30:00+02:00';
    const slots = getNextSlots(start, end, CALENDAR);
    expect(slots.length).to.equal(8 + 7);
  });
});