import { useState, useEffect } from 'react'

// Map race country to SVG track file in /public/tracks/
const TRACK_FILES = {
  'australia': '/tracks/australia.svg',
  'china': '/tracks/china.svg',
  'japan': '/tracks/japan.svg',
  'bahrain': '/tracks/bahrain.svg',
  'saudi-arabia': '/tracks/saudi-arabia.svg',
  'usa': '/tracks/usa.svg',
  'canada': '/tracks/canada.svg',
  'monaco': '/tracks/monaco.svg',
  'spain': '/tracks/spain.svg',
  'austria': '/tracks/austria.svg',
  'great-britain': '/tracks/great-britain.svg',
  'belgium': '/tracks/belgium.svg',
  'hungary': '/tracks/hungary.svg',
  'netherlands': '/tracks/netherlands.svg',
  'italy': '/tracks/italy.svg',
  'azerbaijan': '/tracks/azerbaijan.svg',
  'singapore': '/tracks/singapore.svg',
  'mexico': '/tracks/mexico.svg',
  'brazil': '/tracks/brazil.svg',
  'qatar': '/tracks/qatar.svg',
  'abu-dhabi': '/tracks/abu-dhabi.svg',
  'madrid': '/tracks/madrid.svg',
  'las-vegas': '/tracks/las-vegas.svg',
  'usa-miami': '/tracks/usa-miami.svg',
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
  const trackFile = TRACK_FILES[race.country] || TRACK_FILES['australia']

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
              color:'#bbb',
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
            <img src={trackFile} alt="" width="80" height="80"
              style={{filter: isUrgent ? 'brightness(0) saturate(100%) invert(12%) sepia(95%) saturate(7000%) hue-rotate(347deg)' : 'brightness(0) saturate(100%) invert(72%) sepia(55%) saturate(1000%) hue-rotate(5deg)'}} />
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
                  color:'#aaa',
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
              color:'#aaa',
              letterSpacing:'1px',
              marginBottom:'2px'
            }}>RACE START</div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'0.85rem',
              color:'#bbb',
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
  const trackFile = TRACK_FILES[race.country] || TRACK_FILES['australia']

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
              color:'#bbb',
              marginTop:'4px',
              letterSpacing:'1px'
            }}>
              {race.date} · {new Date(race.raceStart).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit',timeZoneName:'short'})}
            </div>
          </div>

          <div style={{opacity:0.25, flexShrink:0}}>
            <img src={trackFile} alt="" width="80" height="80"
              style={{filter: 'brightness(0) saturate(100%) invert(12%) sepia(95%) saturate(7000%) hue-rotate(347deg)'}} />
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
                  color:'#999',
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
                  color:'#aaa',
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
                color:'#bbb',
                letterSpacing:'1px',
                marginBottom:'2px'
              }}>PICKS LOCK IN</div>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:'1rem',
                color: isUrgent ? '#E8002D' : '#bbb',
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
