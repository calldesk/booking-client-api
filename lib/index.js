
'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment-timezone');
const format = require('util').format;
const getNextSlots = require('./util').getNextSlots;

moment.locale('fr');

// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// for documentation
app.use('/doc', express.static('doc'));
app.use(express.static('doc'));

const port = process.env.PORT || 8080;
const router = express.Router();
const _TWILIO_SECRETS = JSON.parse(fs.readFileSync('.twilio.json', { encoding: 'utf8' }));

// TWILIO demo
// const TWILIO = !!process.env.USE_TWILIO;

// mock ressource database
const ressources = {
  '1': {
    name: 'Les Garçons',
    number: '+33493808790',
    address: '3 rue Centrale, 06300 Nice',
    type: 'restaurant',
    timezone: 'Europe/Paris',
    asyncConfirm: true,
    calendar: [[], // monday (closed)
    [{ start: '11:30', end: '14:30', duration: 60, prob: 0.5 }, { start: '18:30', end: '22:30', duration: 60, prob: 0.5 }], // tuesday
    [{ start: '11:30', end: '14:30', duration: 60, prob: 0.5 }, { start: '18:30', end: '22:30', duration: 60, prob: 0.5 }], // wednesday
    [{ start: '11:30', end: '14:30', duration: 60, prob: 0.5 }, { start: '18:30', end: '22:30', duration: 60, prob: 0.5 }], // thursday
    [{ start: '11:30', end: '14:30', duration: 60, prob: 0.5 }, { start: '18:30', end: '23:30', duration: 60, prob: 0.5 }], // friday
    [{ start: '11:30', end: '14:30', duration: 60, prob: 0.5 }, { start: '18:30', end: '22:30', duration: 60, prob: 0.5 }], // Saturday
    [] // Sunday (closed)
    ]
  },
  '2': {
    name: 'Durant',
    number: '+33442380000',
    address: '6 Rue d\'Italie, 13100 Aix-en-Provence',
    type: 'doctor',
    timezone: 'Europe/Paris',
    asyncConfirm: true,
    calendar: [[{ start: '10:00', end: '18:30', duration: 30, prob: 0.2 }], // M
    [{ start: '09:00', end: '18:30', duration: 30, prob: 0.3 }], // T
    [{ start: '09:00', end: '18:30', duration: 30, prob: 0.3 }], // W
    [{ start: '09:00', end: '18:30', duration: 30, prob: 0.4 }], // T
    [{ start: '09:00', end: '17:00', duration: 30, prob: 0.3 }], // F
    [], // S
    [] // S
    ]
  }
};

function _respond(req, res, data) {
  console.log('->', req.path);
  console.log('->', req.query);
  console.log('<-', data);
  console.log('');
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
}

/**
 * @apiDefine RessourceNotFoundError
 *
 * @apiError RessourceNotFound The id of the Ressource was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "RessourceNotFound",
 *       "id": '3909302'
 *     }
 */

/**
 * @apiDefine BookingCoreParameters
 *
 * @apiParam {String} id Ressource unique ID.
 * @apiParam {Number} number Number of people who would like to attend.
 */

router.route('/ressource')
/**
 * @api {get} /ressource Request all ressources ids [OPTION]
 * @apiVersion 0.0.1
 * @apiName GetRessources
 * @apiGroup Ressource
 *
 * @apiSuccess {[String]} ids Ids of all ressources.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "ids": ['1', '2', '3', '4', '5', '6']
 *     }
 */
.get(function (req, res) {
  _respond(req, res, { ids: Object.keys(ressources) });
});

// TODO better document openHours
router.route('/ressource/:id')
/**
 * @api {get} /ressource/:id Request Ressource information
 * @apiVersion 0.0.1
 * @apiName GetRessource
 * @apiGroup Ressource
 *
 * @apiParam {Number} id Ressource unique ID.
 *
 * @apiSuccess {String} name Name of the ressource.
 * @apiSuccess {String} [number] Phone number of the ressource (In international format without whitespace, optional for type "restaurant" or "doctor").
 * @apiSuccess {String} address Address of the ressource. Street name should be comma separated from zipcode and city.
 * @apiSuccess {String="restaurant","doctor"} type Type of the ressource.
 * @apiSuccess {String} timezone The ressource time zone (to interpret expressions such as "tomorrow")
 * @apiSuccess {Boolean} asyncConfirm True to tell the caller that his booking will be confirmed later.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "Les Garçons",
 *       "number": "+33493808790",
 *       "address": "3 rue Centrale, 06300 Nice",
 *       "type": "restaurant",
 *       "timezone": 'Europe/Paris',
 *       "asyncConfirm": true
 *     }
 *
 * @apiUse RessourceNotFoundError
 */
.get(function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (ressources[req.params.id]) {
    _respond(req, res, ressources[req.params.id]);
  } else {
    res.status(404);
    _respond(req, res, { error: 'RessourceNotFound', id: req.params.id });
  }
});

router.route('/ressource/:id/booking')
/**
 * @api {get} /ressource/:id/booking Request available slots for given number of persons
 * @apiVersion 0.0.1
 * @apiName GetBooking
 * @apiGroup Booking
 *
 * @apiUse BookingCoreParameters
 * @apiParam {String} startDay Starting day (inclusive) of the searched period for available slots. Formated in ISO-8601 date format (with specific time zone designator: 'Z' or '+/-HH:mm'). Number of searched days are free but must be at least one (7 recommended).
 *
 * @apiSuccess {String} endDay Ending day (inclusive) of the searched period. Formated in ISO-8601 date format (with specific time zone designator: 'Z' or '+/-HH:mm'). Number of searched days are free but must be at least one (7 recommended).
 * @apiSuccess {[String]} slots Available slots formated in ISO-8601 date time format (with specific time zone designator: 'Z' or '+/-HH:mm'). Availability must take into account the given number of persons who would like to attend.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "endDay": "2016-04-01Z",
 *       "slots": [
 *         "2015-12-20T10:00:00Z",
 *         "2015-12-20T10:30:00Z",
 *         "2015-12-20T11:00:00Z"
 *       ]
 *     }
 *
 * @apiUse RessourceNotFoundError
 * @apiError MissingParameter number or startDay parameter is missing.
 */
.get(function (req, res) {
  const ressource = ressources[req.params.id];
  if (!ressource) {
    res.status(404);
    return _respond(req, res, {
      error: 'RessourceNotFound',
      id: req.params.id
    });
  }
  let number;
  try {
    number = parseInt(req.query.number, 10);
  } catch (e) {}
  if (typeof number !== 'number' || number.toString() === 'NaN') {
    number = 7;
  }
  console.log('n day: ', number);
  if (req.query.startDay) {
    const endDay = moment(req.query.startDay).add(number, 'd');
    _respond(req, res, {
      endDay: endDay.format(), // one day range only
      slots: getNextSlots(req.query.startDay, endDay.format(), ressource.calendar)
    });
  } else {
    res.status(404);
    _respond(req, res, {
      error: 'MissingParameter',
      query: req.query
    });
  }
})

/**
 * @api {post} /ressource/:id/booking Book ressource
 * @apiVersion 0.0.1
 * @apiName PostBooking
 * @apiGroup Booking
 *
 * @apiUse BookingCoreParameters
 * @apiParam {Number} slot Datetime of the slot to book. Formated in ISO-8601 date time format (with specific time zone designator: 'Z' or '+/-HH:mm').
 * @apiParam {String} phoneNumber Contact phone number. Will be formatted as international phone number, without space.
 * @apiParam {String} name Contact name.
 *
 * @apiSuccess {Boolean} confirmed True if ressource was successfully booked. False otherwise.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "confirmed": true
 *     }
 *
 * @apiUse RessourceNotFoundError
 * @apiError MissingParameter number, slot, phoneNumber or name parameter is missing.
 */
.post(function (req, res) {
  if (ressources[req.params.id]) {
    if (req.query.number && req.query.slot && req.query.phoneNumber && req.query.name) {
      // 10 is a magic number for test coverage
      _respond(req, res, { confirmed: req.query.number !== 10 });
    } else {
      res.status(404);
      _respond(req, res, {
        error: 'MissingParameter',
        query: req.query
      });
    }
  } else {
    res.status(404);
    _respond(req, res, {
      error: 'RessourceNotFound',
      id: req.params.id
    });
  }
});

router.route('/call/:id')
/**
 * @api {post} /call/:id Transfer call
 * @apiVersion 0.0.1
 * @apiName PostCall
 * @apiGroup Call
 *
 * @apiParam {Number} id Call unique ID.
 * @apiParam {String="explicit","infirmFinalConfirmation","bookingNotConfirmed","notUnderstood"} reason The reason of the transfer.
 *
 * @apiSuccess {Boolean} transfered True if call was successfully transfered. False otherwise.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "transfered": true
 *     }
 *
 * @apiError MissingParameter id, to or reason parameter is missing.
 */
.post(function (req, res) {
  if (req.params.id && req.query.reason) {
    const callId = req.params.id;
    const client = require('twilio')(_TWILIO_SECRETS.sid, _TWILIO_SECRETS.token);
    const msg = "Merci d'avoir pris le temps de tester notre démonstration. A très bientôt.";
    const url = format('%s?say=%s', _TWILIO_SECRETS.url, encodeURIComponent(msg));
    console.info('transfer call#%s to %s', callId, url);
    // encodeURIComponent(req.query.reason),
    client.calls(callId).update({
      url: url,
      method: 'POST'
    }, function (err, call) {
      if (err) console.warn(err);
      _respond(req, res, {
        transfered: !err
      });
    });
  } else {
    res.status(404);
    _respond(req, res, {
      error: 'MissingParameter',
      query: req.query
    });
  }
});

// if (TWILIO) {
//   var xml = require('xml');
//   router.route('/twilio/answer').get(function (req, res) {
//     var callId = req.query['CallSid'];
//     // see https://www.twilio.com/docs/api/twiml/sip
//     var xmlRes = xml({
//       Response: [
//         {
//           Dial: [
//             {
//               Sip:
//                 // 'sip:9992522656@sip.tropo.com' +
//                 'sip:vgire151204092000@phone.plivo.com' +
//                 '?callId=' + callId +
//                 '&callerNumber=+33630703232' +
//                 '&callerGuessedName=Pierre David' +
//                 '&ressourceId=2' +
//                 '&apiPath=http://82.225.244.55:8080/v1&apiToken=klet'
//             }
//           ]
//         }
//       ]
//     }, { declaration: true });
//     console.log(xmlRes);
//     res.setHeader('Content-Type', 'application/xml');
//     res.send(xmlRes);
//   });
//   router.route('/twilio/redirect').get(function (req, res) {
//     // TODO redirect to sip:mac151204192216@phone.plivo.com
//     // see https://www.twilio.com/docs/api/twiml/sip
//     var xmlRes = xml({
//       Response: [
//         {
//           Dial: [
//             {
//               Sip: 'sip:mac151204192216@phone.plivo.com' +
//                 '?reason=' + encodeURIComponent(req.query.reason)
//             }
//           ]
//         }
//       ]
//     }, { declaration: true });
//     console.log(xmlRes);
//     res.setHeader('Content-Type', 'application/xml');
//     res.send(xmlRes);
//   });
// }

app.use('/v1', router); // all of our routes will be prefixed with /api
app.listen(port);
console.log('Listening on port ' + port);