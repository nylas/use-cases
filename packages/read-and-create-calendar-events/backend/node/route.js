const { default: Event } = require('nylas/lib/models/event');

exports.readEvents = async (req, res, nylasClient) => {
  const user = res.locals.user;

  const { calendarId, startsAfter, endsBefore, limit } = req.query;

  const events = await nylasClient
    .with(user.accessToken)
    .events.list({
      calendar_id: calendarId,
      starts_after: startsAfter,
      ends_before: endsBefore,
      limit: limit,
    })
    .then((events) => events);

  return res.json(events);
};

exports.readCalendars = async (req, res, nylasClient) => {
  const user = res.locals.user;

  const calendars = await nylasClient
    .with(user.accessToken)
    .calendars.list()
    .then((calendars) => calendars);

  return res.json(calendars);
};

exports.createEvents = async (req, res, nylasClient) => {
  const user = res.locals.user;

  const { calendarId, title, description, startTime, endTime, participants } =
    req.body;

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

  if (participants) {
    event.participants = participants
      .split(/\s*,\s*/)
      .map((email) => ({ email }));
  }

  event.save();

  return res.json(event);
};
