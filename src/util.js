// @flow
'use strict';
const assert = require('assert');
const moment = require('moment-timezone');
moment.locale('fr');
export type SlotDef = {start: string, end: string, prob: number, duration: number}

module.exports.getNextSlots = function (start: string, end: string, calendar: Array<Array<SlotDef>>): Array<string> {
  assert(calendar.length === 7, 'bad calendar');
  const mStart = moment(start);
  const mEnd = moment(end);
  const startWD = mStart.weekday();
  const slots = [];
  let done = false;
  for (let i = 0; i < 7; i++) {
    if (done) break;
    const wd = (startWD + i) % 7;
    calendar[wd].forEach((slot) => {
      const sGps = /(\d{2}):(\d{2})/.exec(slot.start);
      const eGps = /(\d{2}):(\d{2})/.exec(slot.end);
      const slotStart = moment(start).add(i, 'd').hour(parseInt(sGps[1], 10)).minute(parseInt(sGps[2], 10));
      if (slotStart > mEnd || done) {
        done = true;
        return;
      }
      const slotEnd = moment(start).add(i, 'd').hour(parseInt(eGps[1], 10)).minute(parseInt(eGps[2], 10));
      assert(slotEnd > slotStart, 'start must be lt end...');
      /* eslint-disable no-unmodified-loop-condition */
      while (mStart > slotStart) {
        slotStart.add(slot.duration, 'minute');
      }
      /* eslint-enable no-unmodified-loop-condition */
      while (true) {
        if (moment(slotStart).add(slot.duration, 'minute') > mEnd) break;
        if (Math.random() >= (1 - slot.prob)) slots.push(slotStart.format());
        slotStart.add(slot.duration, 'minute');
        if (slotStart >= slotEnd) break;
      }
    });
  }
  return slots;
};
