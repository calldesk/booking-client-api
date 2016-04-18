var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// for documentation
app.use('/doc', express.static('doc'));
app.use(express.static('doc'));

var port = process.env.PORT || 8081;
var router = express.Router();

// mock ressource database
var ressources = {
  1: {
    name: 'Les Garçons',
    number: '+33493808790',
    address: '3 rue Centrale, 06300 Nice',
    type: 'restaurant',
    timeZone: 'Europe/Paris',
    asyncConfirm: true
  },
  2: {
    name: 'La Bulle',
    number: '+33140373451',
    address: '48 rue Louis Blanc, 75010 Paris',
    type: 'restaurant',
    timeZone: 'Europe/Paris',
    asyncConfirm: true
  }
};

/**
 * @apiDefine RessourceNotFoundError
 *
 * @apiError RessourceNotFound The id of the Ressource was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "RessourceNotFound",
 *       "id": 3909302
 *     }
 */

 /**
  * @apiDefine BookingCoreParameters
  *
  * @apiParam {Number} id Ressource unique ID.
  * @apiParam {Number} number Number of people who would like to attend.
  */

router.route('/ressource')
  /**
   * @api {get} /ressource Request all ressources ids [OPTION]
   * @apiVersion 0.0.1
   * @apiName GetRessources
   * @apiGroup Ressource
   *
   * @apiSuccess {[Number]} ids Ids of all ressources.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "ids": [1, 2, 3, 4, 5, 6]
   *     }
   */
  .get(function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      ids: Object.keys(ressources)
    });
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
  * @apiSuccess {String} number Phone number of the ressource (In international format without whitespace).
  * @apiSuccess {String} address Address of the ressource. Street name should be comma separated from zipcode and city.
  * @apiSuccess {String="restaurant","doctor"} type Type of the ressource.
  * @apiSuccess {String} timeZone The ressource time zone.
  * @apiSuccess {Boolean} asyncConfirm True to tell the caller that his booking will be confirmed later.
  *
  * @apiSuccessExample Success-Response:
  *     HTTP/1.1 200 OK
  *     {
  *       "name": "Les Garçons",
  *       "number": "+33493808790",
  *       "address": "3 rue Centrale, 06300 Nice",
  *       "type": "restaurant",
  *       "timeZone": 'Europe/Paris',
  *       "asyncConfirm": true
  *     }
  *
  * @apiUse RessourceNotFoundError
  */
  .get(function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    var id = parseInt(req.params.id, 10);
    if (ressources[id]) {
      res.json(ressources[id]);
    } else {
      res.status(404).json({
        error: 'RessourceNotFound',
        id: id
      });
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
   * @apiParam {String} startDay Starting day (inclusive) of the searched period for available slots. Formated in ISO-8601 dateTtime format (in ressource timezone if none specified). Number of searched days are free but must be at least one (7 recommended).
   *
   * @apiSuccess {String} endDay Ending day (inclusive) of the searched period. Formated in ISO-8601 dateTtime format (in ressource timezone if none specified). Number of searched days are free but must be at least one (7 recommended).
   * @apiSuccess {[String]} slots Available slots formated in ISO-8601 dateTtime format (in ressource timezone if none specified). Availability must take into account the given number of persons who would like to attend.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "endDay": "2016-04-01",
   *       "slots": [
   *         "2015-12-20T10:00:00",
   *         "2015-12-20T10:30:00",
   *         "2015-12-20T11:00:00"
   *       ]
   *     }
   *
   * @apiUse RessourceNotFoundError
   * @apiError MissingParameter number or startDay parameter is missing.
   */
  .get(function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    var id = parseInt(req.params.id, 10);
    if (ressources[id]) {
      if (req.query.number && req.query.startDay) {
        var date = new Date(req.query.startDay);
        // build fake slots:
        var slots = [];
        // close on Saturday, Sunday and Monday
        if (date.getDay() !== 6 && date.getDay() !== 0 && date.getDay() !== 1) {
          // random slots at 11h30, 12, 12h30, 13h
          date.setHours(11, 30, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(12, 0, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(12, 30, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(13, 0, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          // random slots at 19h30, 20h, 20h30, 21h, 21h30, 22h
          date.setHours(19, 30, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(20, 0, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(20, 30, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(21, 0, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(21, 30, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
          date.setHours(22, 0, 0, 0);
          Math.random() > 0.5 && slots.push(date.toISOString());
        }
        res.json({
          endDay: req.query.startDay, // one day range only
          slots: slots
        });
      } else {
        res.status(404).json({
          error: 'MissingParameter',
          query: req.query
        });
      }
    } else {
      res.status(404).json({
        error: 'RessourceNotFound',
        id: id
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
   * @apiParam {Number} slot Datetime of the slot to book. Formated in ISO-8601 dateTtime format (in ressource timezone if none specified).
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
    res.setHeader('Content-Type', 'application/json');
    var id = parseInt(req.params.id, 10);
    if (ressources[id]) {
      if (req.query.number && req.query.slotStart && req.phoneNumber && req.name && req.test) {
        res.json({
          confirmed: true
        });
      } else {
        res.status(404).json({
          error: 'MissingParameter',
          query: req.query
        });
      }
    } else {
      res.status(404).json({
        error: 'RessourceNotFound',
        id: id
      });
    }
  });

app.use('/v1', router); // all of our routes will be prefixed with /api
app.listen(port);
console.log('Listening on port ' + port);
