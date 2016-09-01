// @flow
'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment-timezone');
const format = require('util').format;
const getNextSlots = require('./util').getNextSlots;

moment.locale('fr');
moment.tz.setDefault('Europe/Paris');

// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// for documentation
app.use('/doc', express.static('doc'));
app.use(express.static('doc'));

const port = process.env.PORT || 8080;
const router = express.Router();

// mock ressource database
const ressources = {
  '1': {
    name: 'Les Garçons',
    number: '+33493808790',
    address: '3 rue Centrale, 06300 Nice',
    type: 'restaurant',
    timezone: 'Europe/Paris',
    asyncConfirm: true,
    calendar: [
      [],                                                        // monday (closed)
      [{start: '11:30', end: '14:30', duration: 60, prob: 0.5},
       {start: '18:30', end: '22:30', duration: 60, prob: 0.5}], // tuesday
      [{start: '11:30', end: '14:30', duration: 60, prob: 0.5},
       {start: '18:30', end: '22:30', duration: 60, prob: 0.5}], // wednesday
      [{start: '11:30', end: '14:30', duration: 60, prob: 0.5},
       {start: '18:30', end: '22:30', duration: 60, prob: 0.5}], // thursday
      [{start: '11:30', end: '14:30', duration: 60, prob: 0.5},
       {start: '18:30', end: '23:30', duration: 60, prob: 0.5}], // friday
      [{start: '11:30', end: '14:30', duration: 60, prob: 0.5},
       {start: '18:30', end: '22:30', duration: 60, prob: 0.5}], // Saturday
      []                                                         // Sunday (closed)
    ]
  },
  '2': {
    name: 'Durant',
    number: '+33442380000',
    address: '6 Rue d\'Italie, 13100 Aix-en-Provence',
    type: 'doctor',
    timezone: 'Europe/Paris',
    asyncConfirm: true,
    calendar: [
      [{start: '10:00', end: '20:00', duration: 60, prob: 0.3}], // M
      [{start: '09:00', end: '20:00', duration: 60, prob: 0.4}], // T
      [{start: '09:00', end: '20:00', duration: 60, prob: 0.3}], // W
      [{start: '09:00', end: '20:00', duration: 60, prob: 0.4}], // T
      [{start: '09:00', end: '17:00', duration: 60, prob: 0.3}], // F
      [],                                                        // S
      []                                                         // S
    ]
  }
};

function _respond (req, res, data) {
  console.log('->', req.path);
  console.log('->', req.query);
  console.log('<-', data);
  console.log('');
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
}

router.route('/ressource/:id')
 /**
  * @api {get} /ressource/:ressourceId Request Ressource information
  * @apiVersion 1.0.0
  * @apiName GetRessource
  * @apiGroup Ressource
  * @apiDescription Returns information for a specific ressource such as a doctor.
  *
  * @apiParam {String} ressourceId Unique ID of the ressource (must be passed in SIP headers during call transfer).
  *
  * @apiSuccess {String} name Name of the ressource, the doctor`s name for example.
  * @apiSuccess {String} address Address of the ressource. Street name should be comma separated from zipcode and city.
  * @apiSuccess {String} timezone The timezone of the ressource (to interpret expressions such as "tomorrow", see <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones" target="_blank">this article</a> for more information)
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {
  *       "name": "Durant",
  *       "address": "3 rue Centrale, 06300 Nice",
  *       "timezone": 'Europe/Paris',
  *     }
  *
  * @apiError 404 <code>ressourceId</code> not found.
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

router.route('/ressource/:id/slot')
  /**
   * @api {get} /ressource/:ressourceId/slot?startDate=<YYYY-MM-DDTHH:mm:ssZ> Request available slots
   * @apiVersion 1.0.0
   * @apiName GetSlot
   * @apiGroup Slot
   * @apiDescription Returns all available slots for a given period.
   * The period starts at <code>startDate</code> and may have a custom duration (example: 7 days).
   * The end of the period must be returned in the response body (see below).
   *
   * @apiParam {String} ressourceId Unique ID of the ressource
   * @apiParam {String} startDate Starting date (inclusive) of the searched period for available slots. Formated in <a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO-8601</a> date format (with specific time zone designator: 'Z' or '+/-HH:mm'). Number of searched days are free but must be at least one (7 recommended).
   *
   * @apiSuccess {String} endDate Ending date (inclusive) of the searched period. Formated in <a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO-8601</a> date format (with specific time zone designator: 'Z' or '+/-HH:mm'). Number of searched days are free but must be at least one (7 recommended).
   * @apiSuccess {[String]} slots Available slots formated in <a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO-8601</a> date time format (with specific time zone designator: 'Z' or '+/-HH:mm').
   *
   * @apiSuccessExample Success-Response:
   *     HTTP 200 OK
   *     {
   *       "endDate": "2015-12-21T00:00:00Z",
   *       "slots": [
   *         "2015-12-20T10:00:00Z",
   *         "2015-12-20T10:30:00Z",
   *         "2015-12-20T11:00:00Z"
   *       ]
   *     }
   *
   * @apiError 400 Not found, parameter <code>parameterName</code> is missing or invalid.
   * @apiError 404 No ressource found for the given <code>ressourceId</code>.
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
    if (req.query.startDay) {
      const endDate = moment(req.query.startDay).add(number, 'd').format();
      _respond(req, res, {
        endDate: endDate,
        slots: getNextSlots(req.query.startDay, endDate, ressource.calendar)
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
   * @api {post} /ressource/:ressourceId/slot/:slotId Book a slot
   * @apiVersion 1.0.0
   * @apiName BookSlot
   * @apiGroup Slot
   *
   * @apiParam {String} ressourceId Unique ID of the ressource
   * @apiParam {String} slotId Datetime of the slot to book, formated in <a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO-8601</a> date time format (with specific time zone designator: 'Z' or '+/-HH:mm').
   * @apiParam {String} phoneNumber Contact phone number. Will be formatted as international phone number, without space.
   * @apiParam {String} name Contact name.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP 200 OK
   *
   * @apiError 400 bad request, missing parameter <code>parameterName</code>.
   * @apiError 404 No ressource found for the given <code>ressourceId</code>.
   * @apiError 409 Request could not be processed because selected slot has been booked already.
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
   * @api {post} /call/:callId Transfer
   * @apiVersion 1.0.0
   * @apiName TransferCall
   * @apiGroup Call
   *
   * @apiParam {String} callId Unique ID of the call.
   * @apiParam {String="TRANSFER_ASKED_BY_USER", "CALL_DISCONNECTED_BEFORE_BEING_DONE", "TRANSFER_AFTER_TO_MANY_NOT_UNDERSTOOD","TRANSFER_AFTER_ERROR"} reason The reason of the transfer.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP 200 OK
   *
   * @apiError 400 bad request, missing parameter <code>callId</code>.
   * @apiError 404 Not found. No call found for the given <code>callId</code>.
   */
  .post(function (req, res) {
    if (req.params.id && req.query.reason) {
      if (fs.exists('.twilio.json')) {
        const _TWILIO_SECRETS = JSON.parse(fs.readFileSync('.twilio.json', { encoding: 'utf8' }));
        const callId = req.params.id;
        const client = require('twilio')(_TWILIO_SECRETS.sid, _TWILIO_SECRETS.token);
        const msg = "Merci d'avoir pris le temps de tester notre démonstration. A très bientôt.";
        const url = format('%s?say=%s', _TWILIO_SECRETS.url, encodeURIComponent(msg));
        console.info('transfer call#%s to %s', callId, url);
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
        _respond(req, res, {
          transfered: false
        });
      }
    } else {
      res.status(404);
      _respond(req, res, {
        error: 'MissingParameter',
        query: req.query
      });
    }
  });

app.use('/v1', router); // all of our routes will be prefixed with /api
app.listen(port);
console.log('Listening on port ' + port);
