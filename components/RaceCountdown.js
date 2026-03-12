import { useState, useEffect } from 'react'

const TRACK_PATHS = {
  // Albert Park — clockwise lake circuit, long straights with tight chicanes
  'australia':    'M30,15 L70,15 Q80,15 80,25 L80,38 L72,42 L80,48 L80,65 Q80,75 70,80 L55,85 Q45,88 38,82 L25,70 Q18,62 18,50 L18,35 Q18,20 30,15 Z',

  // Shanghai — iconic "shang" double hairpin at top, long back straight
  'china':        'M25,20 L40,20 Q48,20 50,15 Q52,20 60,20 L75,20 Q82,20 82,28 L82,45 L70,50 L70,65 Q70,75 60,78 L45,80 Q35,80 30,72 L22,55 Q18,45 18,35 L18,28 Q18,20 25,20 Z',

  // Suzuka — figure-8 crossover, esses, spoon curve, 130R
  'japan':        'M20,30 Q20,18 32,18 L55,18 Q68,18 72,28 L75,42 Q76,52 68,55 L55,55 Q48,55 48,62 L48,72 Q48,82 38,82 L28,80 Q18,78 18,68 L20,55 Q22,48 30,48 L42,48 Q50,48 50,40 L48,30 Q46,24 38,24 L28,26 Q20,30 20,30 Z',

  // Bahrain — tight infield, long straights, multi-apex turns
  'bahrain':      'M35,15 L65,15 Q75,15 75,25 L75,40 L68,45 L75,52 L75,70 Q75,80 65,82 L45,82 Q35,82 32,75 L28,55 L35,48 L28,40 L28,25 Q28,15 35,15 Z',

  // Jeddah — ultra-fast street circuit, flowing S-curves, very long
  'saudi-arabia': 'M75,85 L75,25 Q75,15 65,15 L55,15 Q48,15 48,22 L48,35 Q48,42 42,42 L35,42 Q28,42 28,50 L28,60 Q28,68 35,68 L42,68 Q48,68 48,75 L48,82 Q48,88 40,88 L25,85 Q18,82 18,72 L18,30 Q18,18 28,15',

  // Miami — Hard Rock Stadium, straights and chicanes
  'usa-miami':    'M25,20 L70,20 Q80,20 80,30 L80,45 L72,50 L80,55 L80,70 Q80,80 70,80 L35,80 Q25,80 22,72 L20,55 Q18,45 22,38 L30,35 Q35,30 30,25 Q28,20 25,20 Z',

  // Montreal — Île Notre-Dame, long straights, tight chicanes, Wall of Champions
  'canada':       'M20,25 L75,20 Q82,20 82,28 L82,40 L75,42 L82,46 L82,58 L75,62 L82,68 L82,78 Q82,85 72,85 L25,85 Q18,85 18,78 L18,35 Q18,25 25,25 Z',

  // Monaco — hairpin, tunnel, swimming pool chicane
  'monaco':       'M25,25 L65,22 Q75,22 75,30 L75,38 L82,42 Q88,45 85,52 L78,58 L70,55 L60,60 Q55,65 50,62 L40,58 Q32,55 28,60 L22,70 Q18,75 22,80 L60,82 Q72,82 72,72 L72,55',

  // Barcelona — long straight, sweeping turns, tight final sector
  'spain':        'M25,18 L68,18 Q78,18 80,28 L82,42 Q82,52 75,55 L65,55 Q58,55 58,62 L58,72 Q58,80 48,82 L35,82 Q25,80 22,72 L18,50 Q16,38 20,26 Z',

  // Red Bull Ring — short, steep, 3 big straights
  'austria':      'M30,22 L70,18 Q80,16 82,25 L82,38 Q82,45 76,48 L60,55 Q52,58 52,65 L52,72 Q52,80 42,80 L30,78 Q20,76 20,65 L22,45 Q24,35 30,32 Z',

  // Silverstone — Maggotts-Becketts, fast and flowing
  'great-britain':'M35,15 L60,15 Q72,15 75,22 L82,38 Q85,48 78,52 L65,55 L60,48 L48,52 L40,62 Q35,70 28,72 L22,72 Q15,70 15,60 L18,42 Q20,32 28,25 Z',

  // Spa — Eau Rouge, Kemmel straight, La Source
  'belgium':      'M25,30 L25,18 Q25,12 35,12 L60,15 Q70,16 72,25 L72,40 Q72,48 65,52 L55,58 Q48,62 48,70 L50,78 Q52,85 45,88 L30,85 Q20,82 18,72 L18,50 Q18,40 25,35 Z',

  // Hungaroring — tight and twisty, slow corners
  'hungary':      'M30,18 L65,15 Q75,15 78,25 L80,40 Q80,50 72,55 L62,60 Q55,64 55,72 L55,78 Q55,85 45,85 L32,82 Q22,78 20,68 L18,48 Q17,35 22,25 Z',

  // Zandvoort — banked turns, seaside, tight
  'netherlands':  'M28,20 L62,18 Q72,18 75,26 L78,42 Q80,52 72,58 L60,62 Q52,65 50,72 L48,80 Q45,86 36,84 L25,78 Q18,72 18,60 L20,40 Q22,28 28,20 Z',

  // Monza — Temple of Speed, massive straights, tight chicanes
  'italy':        'M30,15 L65,15 Q75,15 75,22 L75,35 L68,38 L75,42 L75,60 Q75,68 68,72 L55,78 Q45,82 38,78 L25,68 Q18,62 18,50 L18,30 Q18,18 28,15 Z',

  // Baku — ultra-long straight, tight old city, castle section
  'azerbaijan':   'M78,82 L78,25 Q78,18 70,18 L40,18 Q32,18 30,25 L28,35 Q26,42 32,45 L42,45 Q48,45 48,52 L45,60 Q42,65 35,65 L25,62 Q18,60 18,68 L20,78 Q22,85 30,85 L78,82 Z',

  // Marina Bay — street circuit, tight corners, waterfront
  'singapore':    'M25,22 L65,18 Q75,18 78,28 L80,45 Q80,55 72,58 L60,60 L58,70 Q55,78 45,80 L30,80 Q20,78 18,68 L18,40 Q18,28 25,22 Z',

  // COTA — iconic S-curves, big elevation, long back straight, stadium section
  'usa':          'M22,25 L35,18 Q42,15 48,20 L55,28 Q58,32 65,28 L78,22 Q85,20 85,28 L85,55 Q85,65 78,68 L65,72 Q55,75 50,82 L35,85 Q22,85 18,72 L18,40 Q18,30 22,25 Z',

  // Hermanos Rodriguez — long straight, peraltada, stadium, high altitude
  'mexico':       'M30,18 L68,18 Q78,18 78,28 L78,42 Q78,50 70,52 L58,52 Q50,52 50,60 L50,72 Q50,80 40,82 L30,82 Q20,80 20,70 L20,50 L28,45 L20,40 L20,28 Q20,18 30,18 Z',

  // Interlagos — anti-clockwise, short lap, big elevation, sweeping curves
  'brazil':       'M72,25 L72,65 Q72,75 62,78 L40,82 Q28,82 25,72 L22,50 Q20,40 25,32 L35,22 Q42,18 52,20 L62,22 Q72,22 72,25 Z',

  // Lusail — flowing desert circuit, long straights, fast sweeping corners
  'qatar':        'M28,18 L68,15 Q78,15 80,25 L82,45 Q82,55 75,60 L65,65 Q58,68 55,75 L50,82 Q45,88 38,85 L25,78 Q18,72 18,58 L18,35 Q18,22 28,18 Z',

  // Yas Marina — hotel straddling track, two long straights, tight chicanes
  'abu-dhabi':    'M30,15 L65,15 Q75,15 78,25 L80,42 Q80,52 72,56 L62,56 Q55,56 55,65 L55,75 Q55,82 45,82 L30,82 Q20,80 18,70 L18,45 Q18,30 22,22 Z',

  // Madrid street circuit
  'madrid':       'M25,20 L70,18 Q80,18 82,28 L82,48 Q82,58 74,62 L60,65 Q52,68 52,76 L48,82 Q42,88 34,84 L22,75 Q16,68 18,55 L22,38 Q24,26 32,22 Z',

  // Las Vegas Strip — long straight down the Strip, tight corners
  'las-vegas':    'M25,82 L25,25 Q25,18 35,18 L72,18 Q80,18 80,25 L80,42 Q80,48 74,50 L60,50 Q52,50 52,58 L52,72 Q52,80 45,82 Z',
}

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null)
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        done: false
      })
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [targetDate])
  return timeLeft
}

// QUALI mode — shown on My Picks page, counts down to picks lock
function QualiCountdown({ race }) {
  const countdown = useCountdown(race.qualiLock)
  if (!countdown) return null

  const msUntilQuali = new Date(race.qualiLock) - new Date()
  if (msUntilQuali > 5 * 24 * 60 * 60 * 1000 || countdown.done) return null

  const isUrgent = msUntilQuali < 3 * 60 * 60 * 1000
  const accentColor = isUrgent ? '#E8002D' : '#FFB800'
  const trackPath = TRACK_PATHS[race.country] || TRACK_PATHS['australia']

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d0d12 0%, #0d0d0a 50%, #0d0d12 100%)',
      border: `1px solid ${isUrgent ? '#E8002D' : '#2a2200'}`,
      borderRadius: '12px',
      marginBottom: '20px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: isUrgent ? '0 0 30px rgba(232,0,45,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        height: '3px',
        background: isUrgent
          ? 'linear-gradient(90deg, #E8002D, #ff6b6b, #E8002D)'
          : 'linear-gradient(90deg, #FFB800, #7a5500)',
        animation: isUrgent ? 'pulse-bar 1.5s ease-in-out infinite' : 'none',
        backgroundSize: isUrgent ? '200% 100%' : '100% 100%',
      }} />

      <div style={{padding: '18px 20px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px'}}>
          <div>
            <div style={{
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:'0.6rem',
              letterSpacing:'3px',
              color: accentColor,
              marginBottom:'4px'
            }}>
              {isUrgent ? '🚨 PICKS LOCK SOON' : '🔒 PICKS DEADLINE'}
            </div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'1.8rem',
              letterSpacing:'3px',
              lineHeight:1,
              color:'#eef0f5',
            }}>
              {race.flag} {race.name.toUpperCase()}
            </div>
            <div style={{
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:'0.62rem',
              color:'#444',
              marginTop:'4px',
              letterSpacing:'1px'
            }}>
              LOCKS {new Date(race.qualiLock).toLocaleString('en-US', {
                month:'short', day:'numeric',
                hour:'numeric', minute:'2-digit',
                timeZoneName:'short'
              })}
            </div>
          </div>

          <div style={{opacity:0.2, flexShrink:0}}>
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <path d={trackPath} stroke={accentColor} strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>

        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          {[
            { val: countdown.days,    label: 'DAYS' },
            { val: countdown.hours,   label: 'HRS' },
            { val: countdown.minutes, label: 'MIN' },
            { val: countdown.seconds, label: 'SEC' },
          ].map(({ val, label }, i) => (
            <div key={label} style={{display:'flex', alignItems:'center', gap:'8px'}}>
              {i > 0 && (
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:'1.4rem',
                  color:'#2a2200',
                  marginTop:'-8px'
                }}>:</div>
              )}
              <div style={{textAlign:'center'}}>
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:'2.2rem',
                  lineHeight:1,
                  color: isUrgent ? '#E8002D' : (i <= 1 ? '#FFB800' : '#eef0f5'),
                  minWidth:'42px',
                  textAlign:'center',
                  transition:'color 0.3s',
                  textShadow: isUrgent ? '0 0 20px rgba(232,0,45,0.4)' : (i <= 1 ? '0 0 20px rgba(255,184,0,0.3)' : 'none'),
                }}>
                  {String(val).padStart(2, '0')}
                </div>
                <div style={{
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:'0.5rem',
                  color:'#333',
                  letterSpacing:'2px',
                  marginTop:'2px'
                }}>
                  {label}
                </div>
              </div>
            </div>
          ))}

          <div style={{
            marginLeft:'auto',
            textAlign:'right',
            borderLeft:'1px solid #1e1e2c',
            paddingLeft:'12px'
          }}>
            <div style={{
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:'0.55rem',
              color:'#333',
              letterSpacing:'1px',
              marginBottom:'2px'
            }}>RACE START</div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'0.85rem',
              color:'#444',
              letterSpacing:'1px'
            }}>
              {new Date(race.raceStart).toLocaleString('en-US', {
                month:'short', day:'numeric',
                hour:'numeric', minute:'2-digit',
                timeZoneName:'short'
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-bar {
          0%, 100% { background-position: 0% 50%; opacity: 1; }
          50% { background-position: 100% 50%; opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

// RACE mode — shown on Results/Leaderboard pages, counts down to race start
function RaceStartCountdown({ race }) {
  const countdown = useCountdown(race.raceStart)
  const qualiCountdown = useCountdown(race.qualiLock)
  if (!countdown) return null

  const msUntilRace = new Date(race.raceStart) - new Date()
  if (msUntilRace > 5 * 24 * 60 * 60 * 1000 || msUntilRace < 0) return null

  const isUrgent = qualiCountdown && !qualiCountdown.done &&
    (new Date(race.qualiLock) - new Date()) < 3 * 60 * 60 * 1000
  const trackPath = TRACK_PATHS[race.country] || TRACK_PATHS['australia']

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d0d12 0%, #12080a 50%, #0d0d12 100%)',
      border: `1px solid ${isUrgent ? '#E8002D' : '#1e1e2c'}`,
      borderRadius: '12px',
      marginBottom: '20px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: isUrgent ? '0 0 30px rgba(232,0,45,0.15)' : '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        height: '3px',
        background: isUrgent
          ? 'linear-gradient(90deg, #E8002D, #ff6b6b, #E8002D)'
          : 'linear-gradient(90deg, #E8002D, #8b0000)',
        backgroundSize: isUrgent ? '200% 100%' : '100% 100%',
        animation: isUrgent ? 'pulse-bar 1.5s ease-in-out infinite' : 'none',
      }} />

      <div style={{padding: '18px 20px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px'}}>
          <div>
            <div style={{
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:'0.6rem',
              letterSpacing:'3px',
              color:'#E8002D',
              marginBottom:'4px'
            }}>
              {isUrgent ? '🚨 PICKS LOCK SOON' : '⏱ NEXT RACE'}
            </div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'1.8rem',
              letterSpacing:'3px',
              lineHeight:1,
              color:'#eef0f5',
            }}>
              {race.flag} {race.name.toUpperCase()}
            </div>
            <div style={{
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:'0.62rem',
              color:'#444',
              marginTop:'4px',
              letterSpacing:'1px'
            }}>
              {race.date} · {new Date(race.raceStart).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit',timeZoneName:'short'})}
            </div>
          </div>

          <div style={{opacity:0.25, flexShrink:0}}>
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <path d={trackPath} stroke="#E8002D" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>

        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          {[
            { val: countdown.days,    label: 'DAYS' },
            { val: countdown.hours,   label: 'HRS' },
            { val: countdown.minutes, label: 'MIN' },
            { val: countdown.seconds, label: 'SEC' },
          ].map(({ val, label }, i) => (
            <div key={label} style={{display:'flex', alignItems:'center', gap:'8px'}}>
              {i > 0 && (
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:'1.4rem',
                  color:'#2a2a3a',
                  marginTop:'-8px'
                }}>:</div>
              )}
              <div style={{textAlign:'center'}}>
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize: countdown.days === 0 && i === 0 ? '1.6rem' : '2.2rem',
                  lineHeight:1,
                  color: isUrgent && i >= 2 ? '#E8002D' : '#eef0f5',
                  minWidth:'42px',
                  textAlign:'center',
                  transition:'color 0.3s',
                  textShadow: isUrgent && i >= 2 ? '0 0 20px rgba(232,0,45,0.4)' : 'none',
                }}>
                  {String(val).padStart(2, '0')}
                </div>
                <div style={{
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:'0.5rem',
                  color:'#333',
                  letterSpacing:'2px',
                  marginTop:'2px'
                }}>
                  {label}
                </div>
              </div>
            </div>
          ))}

          {qualiCountdown && !qualiCountdown.done && (
            <div style={{
              marginLeft:'auto',
              textAlign:'right',
              borderLeft:'1px solid #1e1e2c',
              paddingLeft:'12px'
            }}>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:'0.55rem',
                color:'#444',
                letterSpacing:'1px',
                marginBottom:'2px'
              }}>PICKS LOCK IN</div>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:'1rem',
                color: isUrgent ? '#E8002D' : '#666',
                letterSpacing:'1px'
              }}>
                {qualiCountdown.days > 0
                  ? `${qualiCountdown.days}D ${qualiCountdown.hours}H`
                  : qualiCountdown.hours > 0
                    ? `${qualiCountdown.hours}H ${qualiCountdown.minutes}M`
                    : `${qualiCountdown.minutes}M ${qualiCountdown.seconds}S`
                }
              </div>
            </div>
          )}
          {qualiCountdown?.done && !countdown.done && (
            <div style={{
              marginLeft:'auto',
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:'0.6rem',
              color:'#E8002D',
              letterSpacing:'1px',
              borderLeft:'1px solid #1e1e2c',
              paddingLeft:'12px'
            }}>🔒 PICKS<br/>LOCKED</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-bar {
          0%, 100% { background-position: 0% 50%; opacity: 1; }
          50% { background-position: 100% 50%; opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

export default function RaceCountdown({ race, mode = 'race' }) {
  if (mode === 'quali') return <QualiCountdown race={race} />
  return <RaceStartCountdown race={race} />
}
