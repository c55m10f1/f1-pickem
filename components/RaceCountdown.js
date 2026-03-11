import { useState, useEffect } from 'react'

const TRACK_PATHS = {
  'australia':    'M50,20 L80,20 Q90,20 90,30 L90,50 Q90,60 80,65 L70,70 Q60,75 55,85 L50,90 Q45,95 35,90 L25,80 Q15,75 15,65 L15,40 Q15,30 25,25 Z',
  'china':        'M20,15 L75,15 Q85,15 85,25 L85,40 L75,45 L75,65 Q75,75 65,75 L55,75 L50,85 Q45,90 35,85 L20,75 Q15,70 15,60 L15,25 Q15,15 20,15 Z',
  'japan':        'M25,15 L70,15 Q80,15 82,25 L82,35 Q82,42 75,45 L65,48 L65,60 Q65,70 55,72 L40,72 Q30,72 25,65 L18,50 Q15,40 18,30 Z',
  'bahrain':      'M30,15 L65,15 Q75,15 78,25 L80,45 Q80,55 72,60 L65,65 L65,75 Q65,82 55,83 L40,83 Q30,82 28,75 L25,55 Q22,45 25,35 Z',
  'saudi-arabia': 'M25,20 L70,20 Q80,20 82,28 L85,50 Q85,60 78,65 L70,68 L68,78 Q65,85 55,85 L40,85 Q30,84 27,77 L22,55 Q18,42 22,30 Z',
  'usa':          'M20,25 L75,20 Q85,20 85,30 L85,55 Q85,65 75,68 L60,70 L55,80 Q50,88 40,85 L25,78 Q15,72 15,62 L15,35 Q15,25 20,25 Z',
  'canada':       'M30,20 L68,18 Q78,18 80,27 L82,45 Q82,55 74,60 L65,63 L63,73 Q60,82 50,83 L35,82 Q25,80 22,72 L18,50 Q16,38 20,28 Z',
  'monaco':       'M35,15 L60,15 Q68,15 70,22 L72,35 L80,42 Q85,48 82,56 L75,65 Q70,72 62,73 L50,74 Q40,74 35,67 L28,55 Q23,45 25,35 L28,22 Q30,15 35,15 Z',
  'spain':        'M22,20 L72,18 Q82,18 83,27 L85,48 Q84,58 76,62 L67,65 L65,75 Q62,83 52,84 L37,83 Q27,81 24,73 L20,52 Q17,40 20,28 Z',
  'austria':      'M28,18 L66,15 Q76,14 78,23 L80,40 Q80,50 73,55 L65,58 L63,68 Q60,76 50,78 L37,77 Q27,75 24,67 L20,47 Q18,36 21,26 Z',
  'great-britain':'M25,22 L68,18 Q78,17 80,26 L82,46 Q82,56 74,61 L66,64 L64,74 Q61,82 51,83 L36,82 Q26,80 23,72 L19,51 Q17,39 20,29 Z',
  'belgium':      'M30,18 L67,15 Q77,15 79,24 L81,44 Q81,54 73,59 L64,62 L62,72 Q59,80 49,81 L35,80 Q25,78 22,70 L18,49 Q16,37 19,26 Z',
  'hungary':      'M26,20 L69,17 Q79,17 81,26 L83,47 Q83,57 75,62 L66,65 L64,75 Q61,83 51,84 L36,83 Q26,81 23,73 L19,52 Q17,40 20,28 Z',
  'netherlands':  'M28,19 L67,16 Q77,16 79,25 L81,46 Q81,56 73,61 L64,64 L62,74 Q59,82 49,83 L34,82 Q24,80 21,72 L17,51 Q15,39 18,27 Z',
  'italy':        'M24,21 L70,18 Q80,18 82,27 L84,48 Q84,58 76,63 L67,66 L65,76 Q62,84 52,85 L37,84 Q27,82 24,74 L20,53 Q18,41 21,29 Z',
  'azerbaijan':   'M22,22 L71,19 Q81,19 83,28 L85,50 Q85,60 77,65 L68,68 L66,78 Q63,86 53,87 L38,86 Q28,84 25,76 L21,55 Q19,43 22,31 Z',
  'singapore':    'M26,20 L69,17 Q79,17 81,26 L83,47 L75,52 L75,62 Q75,72 65,74 L52,75 L48,83 Q44,89 35,86 L24,77 Q17,70 17,60 L17,30 Q17,20 26,20 Z',
  'mexico':       'M24,20 L70,17 Q80,17 82,26 L84,47 Q84,57 76,62 L67,65 L65,75 Q62,83 52,84 L37,83 Q27,81 24,73 L20,52 Q18,40 21,28 Z',
  'brazil':       'M27,20 L68,17 Q78,17 80,26 L82,47 Q82,57 74,62 L65,65 L63,75 Q60,83 50,84 L35,83 Q25,81 22,73 L18,52 Q16,40 19,28 Z',
  'qatar':        'M25,21 L69,18 Q79,18 81,27 L83,48 Q83,58 75,63 L66,66 L64,76 Q61,84 51,85 L36,84 Q26,82 23,74 L19,53 Q17,41 20,29 Z',
  'abu-dhabi':    'M23,21 L70,18 Q80,18 82,27 L84,49 Q84,59 76,64 L67,67 L65,77 Q62,85 52,86 L37,85 Q27,83 24,75 L20,54 Q18,42 21,30 Z',
  'madrid':       'M24,20 L70,17 Q80,17 82,26 L84,47 Q84,57 76,62 L67,65 L65,75 Q62,83 52,84 L37,83 Q27,81 24,73 L20,52 Q18,40 21,28 Z',
  'las-vegas':    'M20,25 L75,20 Q85,20 85,30 L85,55 Q85,65 75,68 L60,70 L55,80 Q50,88 40,85 L25,78 Q15,72 15,62 L15,35 Q15,25 20,25 Z',
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

  // Show within 5 days of quali lock
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
      {/* Amber top accent bar */}
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

          {/* Track outline — amber tint */}
          <div style={{opacity:0.2, flexShrink:0}}>
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <path d={trackPath} stroke={accentColor} strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="50" cy="20" r="3" fill={accentColor} opacity="0.8"/>
            </svg>
          </div>
        </div>

        {/* Countdown digits — amber theme */}
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

          {/* Race time indicator on the right */}
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
              <circle cx="50" cy="20" r="3" fill="#E8002D" opacity="0.8"/>
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
