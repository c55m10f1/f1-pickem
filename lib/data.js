export const RACES = [
  { id: 'AUS', name: 'Australia',     date: 'Mar 8'  },
  { id: 'CHN', name: 'China',         date: 'Mar 15' },
  { id: 'JPN', name: 'Japan',         date: 'Mar 28' },
  { id: 'BHR', name: 'Bahrain',       date: 'Apr 12' },
  { id: 'KSA', name: 'Saudi Arabia',  date: 'Apr 19' },
  { id: 'MIA', name: 'Miami',         date: 'May 3'  },
  { id: 'CAN', name: 'Canada',        date: 'May 24' },
  { id: 'MON', name: 'Monaco',        date: 'Jun 7'  },
  { id: 'ESP', name: 'Spain',         date: 'Jun 14' },
  { id: 'AUT', name: 'Austria',       date: 'Jun 28' },
  { id: 'GBR', name: 'Great Britain', date: 'Jul 5'  },
  { id: 'BEL', name: 'Belgium',       date: 'Jul 19' },
  { id: 'HUN', name: 'Hungary',       date: 'Jul 26' },
  { id: 'NED', name: 'Netherlands',   date: 'Aug 23' },
  { id: 'ITA', name: 'Italy',         date: 'Sep 6'  },
  { id: 'MAD', name: 'Madrid',        date: 'Sep 13' },
  { id: 'AZE', name: 'Azerbaijan',    date: 'Sep 26' },
  { id: 'SGP', name: 'Singapore',     date: 'Oct 11' },
  { id: 'USA', name: 'United States', date: 'Oct 25' },
  { id: 'MEX', name: 'Mexico',        date: 'Nov 1'  },
  { id: 'BRA', name: 'Brazil',        date: 'Nov 8'  },
  { id: 'LVS', name: 'Las Vegas',     date: 'Nov 21' },
  { id: 'QAT', name: 'Qatar',         date: 'Nov 29' },
  { id: 'ABD', name: 'Abu Dhabi',     date: 'Dec 6'  },
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
