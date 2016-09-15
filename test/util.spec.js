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

const DOCTOR_CALENDAR = [
  [{start: '10:00', end: '20:00', duration: 60, prob: 1}], // M
  [{start: '09:00', end: '20:00', duration: 60, prob: 1}], // T
  [{start: '09:00', end: '20:00', duration: 60, prob: 1}], // W
  [{start: '09:00', end: '20:00', duration: 60, prob: 1}], // T
  [{start: '09:00', end: '17:00', duration: 60, prob: 1}], // F
  [],                                                        // S
  []                                                         // S
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
  it('should preserve timezone', () => {
    // const start = '2016-06-20T23:00:00.000+02:00'; // monday
    const start = '2016-07-04T19:48:35+02:00'; // monday
    const end = moment(start).add(1, 'd').format();   // tuesday
    const slots = getNextSlots(start, end, CALENDAR);
    expect(slots.length).to.equal(18);
    expect(slots).to.eql([
      '2016-07-05T09:00:00+02:00',
      '2016-07-05T09:30:00+02:00',
      '2016-07-05T10:00:00+02:00',
      '2016-07-05T10:30:00+02:00',
      '2016-07-05T11:00:00+02:00',
      '2016-07-05T11:30:00+02:00',
      '2016-07-05T12:00:00+02:00',
      '2016-07-05T12:30:00+02:00',
      '2016-07-05T13:00:00+02:00',
      '2016-07-05T13:30:00+02:00',
      '2016-07-05T14:00:00+02:00',
      '2016-07-05T14:30:00+02:00',
      '2016-07-05T15:00:00+02:00',
      '2016-07-05T15:30:00+02:00',
      '2016-07-05T16:00:00+02:00',
      '2016-07-05T16:30:00+02:00',
      '2016-07-05T17:00:00+02:00',
      '2016-07-05T17:30:00+02:00']);
  });

  it('should NOT propose slots after 20h', () => {
    const start = '2016-07-04T20:09:47+02:00';
    const end = moment(start).add(1, 'd').format();
    const slots = getNextSlots(start, end, DOCTOR_CALENDAR);
    expect(slots).to.eql([
      '2016-07-05T09:00:00+02:00',
      '2016-07-05T10:00:00+02:00',
      '2016-07-05T11:00:00+02:00',
      '2016-07-05T12:00:00+02:00',
      '2016-07-05T13:00:00+02:00',
      '2016-07-05T14:00:00+02:00',
      '2016-07-05T15:00:00+02:00',
      '2016-07-05T16:00:00+02:00',
      '2016-07-05T17:00:00+02:00',
      '2016-07-05T18:00:00+02:00',
      '2016-07-05T19:00:00+02:00']);
  });
});
