const { default: Event } = require('nylas/lib/models/event');
const { mockDb } = require('./utils/mock-db');

exports.readEvents = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.sendStatus(401);
  }

  const events = await nylasClient
    .with(user.accessToken)
    .events.list({
      starts_after: Math.floor(new Date().getTime() / 1000),
      limit: 20,
      ...(req.query.calendarId && { calendar_id: req.query.calendarId }),
    })
    .then((events) => events);

  return res.json(events);
};

exports.readCalendars = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.sendStatus(401);
  }

  const calendars = await nylasClient
    .with(user.accessToken)
    .calendars.list()
    .then((calendars) => calendars);

  return res.json(calendars);
};

exports.createEvents = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.sendStatus(401);
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.sendStatus(401);
  }

  const { calendarId, title, description, startTime, endTime } = req.body;
  if (!calendarId || !title || !startTime || !endTime) {
    return res.status(400).json({
      message:
        'Missing required fields: calendarId, title, starTime or endTime',
    });
  }

  const nylas = nylasClient.with(user.accessToken);

  const event = new Event(nylas);

  event.calendarId = calendarId;
  event.title = title;
  event.description = description;
  event.when.startTime = startTime;
  event.when.endTime = endTime;

  event.save();

  return res.json(event);
};
