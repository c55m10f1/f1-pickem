// qualiLock = UTC time when qualifying starts — picks auto-lock at this moment
// raceStart = UTC time when the race starts — countdown target
// Sprint weekends: lock at sprint qualifying time (Friday)
// For delayed/rescheduled races, commissioner can manually unlock
export const RACES = [
  { id: 'AUS', name: 'Australia',     date: 'Mar 8',  flag: '🇦🇺', country: 'australia',     raceStart: '2026-03-08T04:00:00Z', qualiLock: '2026-03-07T05:00:00Z' },
  { id: 'CHN', name: 'China',         date: 'Mar 15', flag: '🇨🇳', country: 'china',          raceStart: '2026-03-15T07:00:00Z', qualiLock: '2026-03-14T06:00:00Z' },
  { id: 'JPN', name: 'Japan',         date: 'Mar 29', flag: '🇯🇵', country: 'japan',          raceStart: '2026-03-29T05:00:00Z', qualiLock: '2026-03-28T06:00:00Z' },
  { id: 'BHR', name: 'Bahrain',       date: 'Apr 12', flag: '🇧🇭', country: 'bahrain',        raceStart: '2026-04-12T15:00:00Z', qualiLock: '2026-04-11T13:00:00Z' },
  { id: 'KSA', name: 'Saudi Arabia',  date: 'Apr 19', flag: '🇸🇦', country: 'saudi-arabia',   raceStart: '2026-04-19T17:00:00Z', qualiLock: '2026-04-18T17:00:00Z' },
  { id: 'MIA', name: 'Miami',         date: 'May 3',  flag: '🇺🇸', country: 'usa-miami',      raceStart: '2026-05-03T19:00:00Z', qualiLock: '2026-05-02T19:30:00Z' },
  { id: 'CAN', name: 'Canada',        date: 'May 24', flag: '🇨🇦', country: 'canada',         raceStart: '2026-05-24T18:00:00Z', qualiLock: '2026-05-23T20:00:00Z' },
  { id: 'MON', name: 'Monaco',        date: 'Jun 7',  flag: '🇲🇨', country: 'monaco',         raceStart: '2026-06-07T13:00:00Z', qualiLock: '2026-06-06T14:00:00Z' },
  { id: 'ESP', name: 'Spain',         date: 'Jun 14', flag: '🇪🇸', country: 'spain',          raceStart: '2026-06-14T13:00:00Z', qualiLock: '2026-06-13T14:00:00Z' },
  { id: 'AUT', name: 'Austria',       date: 'Jun 28', flag: '🇦🇹', country: 'austria',        raceStart: '2026-06-28T13:00:00Z', qualiLock: '2026-06-27T13:00:00Z' },
  { id: 'GBR', name: 'Great Britain', date: 'Jul 5',  flag: '🇬🇧', country: 'great-britain',  raceStart: '2026-07-05T14:00:00Z', qualiLock: '2026-07-04T14:00:00Z' },
  { id: 'BEL', name: 'Belgium',       date: 'Jul 19', flag: '🇧🇪', country: 'belgium',        raceStart: '2026-07-19T13:00:00Z', qualiLock: '2026-07-18T13:00:00Z' },
  { id: 'HUN', name: 'Hungary',       date: 'Jul 26', flag: '🇭🇺', country: 'hungary',        raceStart: '2026-07-26T13:00:00Z', qualiLock: '2026-07-25T13:00:00Z' },
  { id: 'NED', name: 'Netherlands',   date: 'Aug 23', flag: '🇳🇱', country: 'netherlands',    raceStart: '2026-08-23T13:00:00Z', qualiLock: '2026-08-22T13:00:00Z' },
  { id: 'ITA', name: 'Italy',         date: 'Sep 6',  flag: '🇮🇹', country: 'italy',          raceStart: '2026-09-06T13:00:00Z', qualiLock: '2026-09-05T13:00:00Z' },
  { id: 'MAD', name: 'Madrid',        date: 'Sep 13', flag: '🇪🇸', country: 'madrid',         raceStart: '2026-09-13T13:00:00Z', qualiLock: '2026-09-12T13:00:00Z' },
  { id: 'AZE', name: 'Azerbaijan',    date: 'Sep 26', flag: '🇦🇿', country: 'azerbaijan',     raceStart: '2026-09-26T11:00:00Z', qualiLock: '2026-09-25T13:00:00Z' },
  { id: 'SGP', name: 'Singapore',     date: 'Oct 11', flag: '🇸🇬', country: 'singapore',      raceStart: '2026-10-11T12:00:00Z', qualiLock: '2026-10-10T09:00:00Z' },
  { id: 'USA', name: 'United States', date: 'Oct 25', flag: '🇺🇸', country: 'usa',            raceStart: '2026-10-25T19:00:00Z', qualiLock: '2026-10-24T20:00:00Z' },
  { id: 'MEX', name: 'Mexico',        date: 'Nov 1',  flag: '🇲🇽', country: 'mexico',         raceStart: '2026-11-01T20:00:00Z', qualiLock: '2026-10-31T21:00:00Z' },
  { id: 'BRA', name: 'Brazil',        date: 'Nov 8',  flag: '🇧🇷', country: 'brazil',         raceStart: '2026-11-08T17:00:00Z', qualiLock: '2026-11-07T18:00:00Z' },
  { id: 'LVS', name: 'Las Vegas',     date: 'Nov 21', flag: '🇺🇸', country: 'las-vegas',      raceStart: '2026-11-22T06:00:00Z', qualiLock: '2026-11-21T06:00:00Z' },
  { id: 'QAT', name: 'Qatar',         date: 'Nov 29', flag: '🇶🇦', country: 'qatar',          raceStart: '2026-11-29T13:00:00Z', qualiLock: '2026-11-28T13:00:00Z' },
  { id: 'ABD', name: 'Abu Dhabi',     date: 'Dec 6',  flag: '🇦🇪', country: 'abu-dhabi',      raceStart: '2026-12-06T13:00:00Z', qualiLock: '2026-12-05T13:00:00Z' },
]

export const DRIVERS = [
  'Norris', 'Piastri', 'Russell', 'Hamilton', 'Leclerc', 'Sainz',
  'Verstappen', 'Alonso', 'Stroll', 'Hulkenberg', 'Gasly', 'Doohan',
  'Antonelli', 'Hadjar', 'Lawson', 'Tsunoda', 'Albon', 'Colapinto',
  'Bearman', 'Bortoleto', 'Magnussen', 'Ocon', 'Lindblad',
]

export function calcScore(pick, result) {
  if (!pick || pick.dns || !result) return { p1: 0, p2: 0, p3: 0, bonus: 0, total: 0 }
  const { p1: a1, p2: a2, p3: a3 } = result
  const { p1: pk1, p2: pk2, p3: pk3 } = pick
  const actual = [a1, a2, a3]
  const s1 = pk1 === a1 ? 4 : actual.includes(pk1) ? 1 : 0
  const s2 = pk2 === a2 ? 3 : actual.includes(pk2) ? 1 : 0
  const s3 = pk3 === a3 ? 2 : actual.includes(pk3) ? 1 : 0
  let bonus = 0
  if (pk1 === a1 && pk2 === a2 && pk3 === a3) bonus = 5
  else if ([pk1, pk2, pk3].sort().join() === actual.sort().join()) bonus = 3
  return { p1: s1, p2: s2, p3: s3, bonus, total: s1 + s2 + s3 + bonus }
}

export const COMMISSIONER_EMAIL = 'commissioner@f1pickem.com'
