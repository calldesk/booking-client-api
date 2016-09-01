define({ "api": [  {    "type": "post",    "url": "/call/:callId",    "title": "Transfer",    "version": "1.0.0",    "name": "TransferCall",    "group": "Call",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "callId",            "description": "<p>Unique ID of the call.</p>"          },          {            "group": "Parameter",            "type": "String",            "allowedValues": [              "\"TRANSFER_ASKED_BY_USER\"",              "\"CALL_DISCONNECTED_BEFORE_BEING_DONE\"",              "\"TRANSFER_AFTER_TO_MANY_NOT_UNDERSTOOD\"",              "\"TRANSFER_AFTER_ERROR\""            ],            "optional": false,            "field": "reason",            "description": "<p>The reason of the transfer.</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP 200 OK",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "400",            "description": "<p>bad request, missing parameter <code>callId</code>.</p>"          },          {            "group": "Error 4xx",            "optional": false,            "field": "404",            "description": "<p>Not found. No call found for the given <code>callId</code>.</p>"          }        ]      }    },    "filename": "src/index.js",    "groupTitle": "Call"  },  {    "type": "get",    "url": "/ressource/:ressourceId",    "title": "Request Ressource information",    "version": "1.0.0",    "name": "GetRessource",    "group": "Ressource",    "description": "<p>Returns information for a specific ressource such as a doctor.</p>",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "ressourceId",            "description": "<p>Unique ID of the ressource (must be passed in SIP headers during call transfer).</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "name",            "description": "<p>Name of the ressource, the doctor`s name for example.</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "address",            "description": "<p>Address of the ressource. Street name should be comma separated from zipcode and city.</p>"          },          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "timezone",            "description": "<p>The timezone of the ressource (to interpret expressions such as &quot;tomorrow&quot;, see <a href=\"https://en.wikipedia.org/wiki/List_of_tz_database_time_zones\" target=\"_blank\">this article</a> for more information)</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP/1.1 200 OK\n{\n  \"name\": \"Durant\",\n  \"address\": \"3 rue Centrale, 06300 Nice\",\n  \"timezone\": 'Europe/Paris',\n}",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "404",            "description": "<p><code>ressourceId</code> not found.</p>"          }        ]      }    },    "filename": "src/index.js",    "groupTitle": "Ressource"  },  {    "type": "post",    "url": "/ressource/:ressourceId/slot/:slotId",    "title": "Book a slot",    "version": "1.0.0",    "name": "BookSlot",    "group": "Slot",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "ressourceId",            "description": "<p>Unique ID of the ressource</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "slotId",            "description": "<p>Datetime of the slot to book, formated in <a href=\"https://en.wikipedia.org/wiki/ISO_8601\" target=\"_blank\">ISO-8601</a> date time format (with specific time zone designator: 'Z' or '+/-HH:mm').</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "phoneNumber",            "description": "<p>Contact phone number. Will be formatted as international phone number, without space.</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "name",            "description": "<p>Contact name.</p>"          }        ]      }    },    "success": {      "examples": [        {          "title": "Success-Response:",          "content": "HTTP 200 OK",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "400",            "description": "<p>bad request, missing parameter <code>parameterName</code>.</p>"          },          {            "group": "Error 4xx",            "optional": false,            "field": "404",            "description": "<p>No ressource found for the given <code>ressourceId</code>.</p>"          },          {            "group": "Error 4xx",            "optional": false,            "field": "409",            "description": "<p>Request could not be processed because selected slot has been booked already.</p>"          }        ]      }    },    "filename": "src/index.js",    "groupTitle": "Slot"  },  {    "type": "get",    "url": "/ressource/:ressourceId/slot?startDate=<YYYY-MM-DDTHH:mm:ssZ>",    "title": "Request available slots",    "version": "1.0.0",    "name": "GetSlot",    "group": "Slot",    "description": "<p>Returns all available slots for a given period. The period starts at <code>startDate</code> and may have a custom duration (example: 7 days). The end of the period must be returned in the response body (see below).</p>",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "ressourceId",            "description": "<p>Unique ID of the ressource</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "startDate",            "description": "<p>Starting date (inclusive) of the searched period for available slots. Formated in <a href=\"https://en.wikipedia.org/wiki/ISO_8601\" target=\"_blank\">ISO-8601</a> date format (with specific time zone designator: 'Z' or '+/-HH:mm'). Number of searched days are free but must be at least one (7 recommended).</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "endDate",            "description": "<p>Ending date (inclusive) of the searched period. Formated in <a href=\"https://en.wikipedia.org/wiki/ISO_8601\" target=\"_blank\">ISO-8601</a> date format (with specific time zone designator: 'Z' or '+/-HH:mm'). Number of searched days are free but must be at least one (7 recommended).</p>"          },          {            "group": "Success 200",            "type": "[String]",            "optional": false,            "field": "slots",            "description": "<p>Available slots formated in <a href=\"https://en.wikipedia.org/wiki/ISO_8601\" target=\"_blank\">ISO-8601</a> date time format (with specific time zone designator: 'Z' or '+/-HH:mm').</p>"          }        ]      },      "examples": [        {          "title": "Success-Response:",          "content": "HTTP 200 OK\n{\n  \"endDate\": \"2015-12-21T00:00:00Z\",\n  \"slots\": [\n    \"2015-12-20T10:00:00Z\",\n    \"2015-12-20T10:30:00Z\",\n    \"2015-12-20T11:00:00Z\"\n  ]\n}",          "type": "json"        }      ]    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "400",            "description": "<p>Not found, parameter <code>parameterName</code> is missing or invalid.</p>"          },          {            "group": "Error 4xx",            "optional": false,            "field": "404",            "description": "<p>No ressource found for the given <code>ressourceId</code>.</p>"          }        ]      }    },    "filename": "src/index.js",    "groupTitle": "Slot"  }] });
