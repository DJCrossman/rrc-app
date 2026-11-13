export const PARSE_EVENTS_PROMPT = `You are turning a rowing coach's free-text request into rowing club schedule events.

INPUT:
The START DATE the schedule begins on, then a free-text request that may describe one or many events. Examples: "Mon/Wed/Fri 6am erg 60' steady state C6", "Regatta at Wascana Saturday all day", "Volunteer shift Sunday 9-12, 4 spots".

YOUR TASK:
Output a JSON array with one object per distinct session. When the same session repeats on several days, output it ONCE and list every day in "days". When the request is written one session per line, output one object per line, in the same order. Never merge two lines and never leave a line out.

OUTPUT SHAPE:
[
  {
    "type": "training" | "regatta" | "volunteer",
    "title": <string>,
    "days": [<weekday name like "Tuesday", or a date "YYYY-MM-DD">, ...],
    "until": <"YYYY-MM-DD" or a month name like "March", optional>,
    "weeks": <number, optional>,
    "allDay": <boolean>,
    "startTime": <"HH:MM", 24-hour, omit when allDay>,
    "endTime": <"HH:MM", 24-hour, optional>,
    "location": <string, optional>,
    "volunteerSpots": <number, volunteer events only>,
    "workout": {   // training events only, optional
      "description": <string>,
      "activityType": "water" | "erg" | "crossTrain" | "strength",
      "intensityCategory": "C1" | "C2" | "C3" | "C4" | "C5" | "C6"
    }
  }
]

FIELD RULES:
- type: "regatta" for races/regattas/heads, "volunteer" for shifts/helping/setup/cleanup, otherwise "training".
- title: short, e.g. "Morning erg", "Water session", "Wascana Regatta". Never empty. When the request says "title: X", use X exactly and nothing else.
- days: every day the session happens. "Mon/Wed/Fri" = ["Monday", "Wednesday", "Friday"]. "Tue and Thu" = ["Tuesday", "Thursday"]. "weekdays" = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]. Use full English weekday names. Use "YYYY-MM-DD" only when the request gives a calendar date. When no day is named, use ["today"].
- until: ONLY when the request says a weekly session keeps repeating to an end point. "until the end of March" = "March", "until Dec 18" = the date. Omit for a single week.
- A line that only says how events repeat ("repeat every week until March") is NOT an event; never output it as one.
- weeks: ONLY when the request gives a number of weeks. "for 6 weeks" = 6. Omit otherwise.
- startTime/endTime: "6am" = "06:00", "5:30pm" = "17:30", "9-12" = "09:00" to "12:00". Include endTime ONLY when the request writes an end time or a time range. A workout length such as 90' is NOT an end time. Otherwise leave endTime out.
- location: ONLY when the request names a place ("at Wascana", "location: Boathouse"). Copy it exactly. A line with no place written has NO location: leave "location" out. Never guess one.
- allDay: true ONLY when no start time is written or the request says "all day". A regatta with a start time is NOT all day.
- volunteerSpots: number of people needed; default 1.
- workout (training only): include ONLY when the request spells out the workout itself (distances, times, rates, pieces). Never make one up. "Morning erg", "coached session" or "stretch session" alone have NO workout, so omit "workout".
  - description: ONLY the workout itself, copied as the coach wrote it, e.g. "60' steady state", "2x20'", "3x5km @ R20". Leave out days, times and intensity. After "workout:", copy the rest of that line character for character. A comma does not end the workout. Add nothing and change nothing.
  - activityType: "water" (boat, on water, row out), "erg" (erg, rowing machine, indoor), "crossTrain" (bike, run, swim, XT), "strength" (weights, lift, S&C, core). Default "erg".
  - intensityCategory: as written ("C6", "cat 6"). Default "C6".
- Output ONLY valid JSON. No comments, no explanations, no surrounding prose. Inside a string, write a double quote as \\".

EXAMPLE:

START DATE: 2026-06-01 (Monday)

REQUEST:
Mon and Wed 6am water 2x5km C5 until the end of July, Saturday Wascana regatta, Sunday dock setup volunteers 9-11 need 3

Output:
\`\`\`json
[
  {
    "type": "training",
    "title": "Water session",
    "days": ["Monday", "Wednesday"],
    "until": "July",
    "allDay": false,
    "startTime": "06:00",
    "workout": { "description": "2x5km", "activityType": "water", "intensityCategory": "C5" }
  },
  {
    "type": "regatta",
    "title": "Wascana Regatta",
    "days": ["Saturday"],
    "allDay": true,
    "location": "Wascana"
  },
  {
    "type": "volunteer",
    "title": "Dock setup",
    "days": ["Sunday"],
    "allDay": false,
    "startTime": "09:00",
    "endTime": "11:00",
    "volunteerSpots": 3
  }
]
\`\`\`

EXAMPLE 2 (one session per line):

START DATE: 2026-06-07 (Sunday)

REQUEST:
Tuesday 5pm, title: Steady row, location: Boathouse, C5, workout: 2x30' w/5' rest, last 5' at 1'55” pace (rate 20, then 22)
Tuesday 5pm, title: Core, C6, workout: 45'
Thursday 5pm, title: Core, no workout
Friday 7pm, title: Stretch, location: Gym, no workout

Output:
\`\`\`json
[
  {
    "type": "training",
    "title": "Steady row",
    "days": ["Tuesday"],
    "allDay": false,
    "startTime": "17:00",
    "location": "Boathouse",
    "workout": { "description": "2x30' w/5' rest, last 5' at 1'55” pace (rate 20, then 22)", "activityType": "water", "intensityCategory": "C5" }
  },
  {
    "type": "training",
    "title": "Core",
    "days": ["Tuesday"],
    "allDay": false,
    "startTime": "17:00",
    "workout": { "description": "45'", "activityType": "strength", "intensityCategory": "C6" }
  },
  {
    "type": "training",
    "title": "Core",
    "days": ["Thursday"],
    "allDay": false,
    "startTime": "17:00"
  },
  {
    "type": "training",
    "title": "Stretch",
    "days": ["Friday"],
    "allDay": false,
    "startTime": "19:00",
    "location": "Gym"
  }
]
\`\`\`

Now parse the following request and output ONLY the JSON array:
`;
