// qualiLock = UTC time when qualifying starts — picks auto-lock at this moment
// Sprint weekends: lock at sprint qualifying time (Friday)
// For delayed/rescheduled races, commissioner can manually unlock
export const RACES = [
  { id: 'AUS', name: 'Australia',     date: 'Mar 8',  qualiLock: '2026-03-07T05:00:00Z' }, // Sat 05:00 UTC (done)
  { id: 'CHN', name: 'China',         date: 'Mar 15', qualiLock: '2026-03-14T06:00:00Z' }, // Sat 06:00 UTC (Sprint SQ Fri)
  { id: 'JPN', name: 'Japan',         date: 'Mar 29', qualiLock: '2026-03-28T06:00:00Z' }, // Sat 06:00 UTC
  { id: 'BHR', name: 'Bahrain',       date: 'Apr 12', qualiLock: '2026-04-11T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'KSA', name: 'Saudi Arabia',  date: 'Apr 19', qualiLock: '2026-04-18T17:00:00Z' }, // Sat 17:00 UTC
  { id: 'MIA', name: 'Miami',         date: 'May 3',  qualiLock: '2026-05-02T19:30:00Z' }, // Sat 19:30 UTC (Sprint)
  { id: 'CAN', name: 'Canada',        date: 'May 24', qualiLock: '2026-05-23T20:00:00Z' }, // Sat 20:00 UTC (Sprint)
  { id: 'MON', name: 'Monaco',        date: 'Jun 7',  qualiLock: '2026-06-06T14:00:00Z' }, // Sat 14:00 UTC
  { id: 'ESP', name: 'Spain',         date: 'Jun 14', qualiLock: '2026-06-13T14:00:00Z' }, // Sat 14:00 UTC
  { id: 'AUT', name: 'Austria',       date: 'Jun 28', qualiLock: '2026-06-27T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'GBR', name: 'Great Britain', date: 'Jul 5',  qualiLock: '2026-07-04T14:00:00Z' }, // Sat 14:00 UTC (Sprint)
  { id: 'BEL', name: 'Belgium',       date: 'Jul 19', qualiLock: '2026-07-18T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'HUN', name: 'Hungary',       date: 'Jul 26', qualiLock: '2026-07-25T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'NED', name: 'Netherlands',   date: 'Aug 23', qualiLock: '2026-08-22T13:00:00Z' }, // Sat 13:00 UTC (Sprint)
  { id: 'ITA', name: 'Italy',         date: 'Sep 6',  qualiLock: '2026-09-05T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'MAD', name: 'Madrid',        date: 'Sep 13', qualiLock: '2026-09-12T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'AZE', name: 'Azerbaijan',    date: 'Sep 26', qualiLock: '2026-09-25T13:00:00Z' }, // Sat 13:00 UTC
  { id: 'SGP', name: 'Singapore',     date: 'Oct 11', qualiLock: '2026-10-10T09:00:00Z' }, // Sat 09:00 UTC (Sprint)
  { id: 'USA', name: 'United States', date: 'Oct 25', qualiLock: '2026-10-24T20:00:00Z' }, // Sat 20:00 UTC
  { id: 'MEX', name: 'Mexico',        date: 'Nov 1',  qualiLock: '2026-10-31T21:00:00Z' }, // Sat 21:00 UTC
  { id: 'BRA', name: 'Brazil',        date: 'Nov 8',  qualiLock: '2026-11-07T18:00:00Z' }, // Sat 18:00 UTC
  { id: 'LVS', name: 'Las Vegas',     date: 'Nov 21', qualiLock: '2026-11-21T06:00:00Z' }, // Sat 06:00 UTC (night race — early lock)
  { id: 'QAT', name: 'Qatar',         date: 'Nov 29', qualiLock: '2026-11-28T13:00:00Z' }, // Sat 13:00 UTC (Sprint)
  { id: 'ABD', name: 'Abu Dhabi',     date: 'Dec 6',  qualiLock: '2026-12-05T13:00:00Z' }, // Sat 13:00 UTC
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
