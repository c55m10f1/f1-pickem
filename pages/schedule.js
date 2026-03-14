import Layout from '../components/Layout'
import { RACES } from '../lib/data'

const TRACK_FILES = {
  'australia': '/tracks/australia.svg',
  'china': '/tracks/china.svg',
  'japan': '/tracks/japan.svg',
  'bahrain': '/tracks/bahrain.svg',
  'saudi-arabia': '/tracks/saudi-arabia.svg',
  'usa': '/tracks/usa.svg',
  'usa-miami': '/tracks/usa-miami.svg',
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
}

const SCHEDULE = [
  { id: "AUS", name: "Australia", circuit: "Albert Park", sprint: false, quCT: "Sat Mar 7, 12:00 AM CT", raceCT: "Sat Mar 7, 11:00 PM CT" },
  { id: "CHN", name: "China", circuit: "Shanghai", sprint: true, quCT: "Sat Mar 14, 2:00 AM CT", raceCT: "Sun Mar 15, 2:00 AM CT" },
  { id: "JPN", name: "Japan", circuit: "Suzuka", sprint: false, quCT: "Sat Mar 28, 1:00 AM CT", raceCT: "Sun Mar 29, 12:00 AM CT" },
  { id: "BHR", name: "Bahrain", circuit: "Bahrain International", sprint: false, quCT: "Sat Apr 11, 11:00 AM CT", raceCT: "Sun Apr 12, 10:00 AM CT" },
  { id: "KSA", name: "Saudi Arabia", circuit: "Jeddah", sprint: false, quCT: "Sat Apr 18, 12:00 PM CT", raceCT: "Sun Apr 19, 12:00 PM CT" },
  { id: "MIA", name: "Miami", circuit: "Miami International Autodrome", sprint: true, quCT: "Sat May 2, 3:00 PM CT", raceCT: "Sun May 3, 3:00 PM CT" },
  { id: "CAN", name: "Canada", circuit: "Circuit Gilles Villeneuve", sprint: true, quCT: "Sat May 23, 3:00 PM CT", raceCT: "Sun May 24, 3:00 PM CT" },
  { id: "MON", name: "Monaco", circuit: "Monte Carlo", sprint: false, quCT: "Sat Jun 6, 9:00 AM CT", raceCT: "Sun Jun 7, 8:00 AM CT" },
  { id: "ESP", name: "Spain", circuit: "Circuit de Barcelona-Catalunya", sprint: false, quCT: "Sat Jun 13, 9:00 AM CT", raceCT: "Sun Jun 14, 8:00 AM CT" },
  { id: "AUT", name: "Austria", circuit: "Red Bull Ring", sprint: false, quCT: "Sat Jun 27, 9:00 AM CT", raceCT: "Sun Jun 28, 8:00 AM CT" },
  { id: "GBR", name: "Great Britain", circuit: "Silverstone", sprint: true, quCT: "Sat Jul 4, 10:00 AM CT", raceCT: "Sun Jul 5, 9:00 AM CT" },
  { id: "BEL", name: "Belgium", circuit: "Spa-Francorchamps", sprint: false, quCT: "Sat Jul 18, 9:00 AM CT", raceCT: "Sun Jul 19, 8:00 AM CT" },
  { id: "HUN", name: "Hungary", circuit: "Hungaroring", sprint: false, quCT: "Sat Jul 25, 9:00 AM CT", raceCT: "Sun Jul 26, 8:00 AM CT" },
  { id: "NED", name: "Netherlands", circuit: "Zandvoort", sprint: true, quCT: "Sat Aug 22, 9:00 AM CT", raceCT: "Sun Aug 23, 8:00 AM CT" },
  { id: "ITA", name: "Italy", circuit: "Monza", sprint: false, quCT: "Sat Sep 5, 9:00 AM CT", raceCT: "Sun Sep 6, 8:00 AM CT" },
  { id: "MAD", name: "Madrid", circuit: "MadRing", sprint: false, quCT: "Sat Sep 12, 9:00 AM CT", raceCT: "Sun Sep 13, 8:00 AM CT" },
  { id: "AZE", name: "Azerbaijan", circuit: "Baku", sprint: false, quCT: "Fri Sep 25, 7:00 AM CT", raceCT: "Sat Sep 26, 6:00 AM CT" },
  { id: "SGP", name: "Singapore", circuit: "Marina Bay", sprint: true, quCT: "Sat Oct 10, 8:00 AM CT", raceCT: "Sun Oct 11, 7:00 AM CT" },
  { id: "USA", name: "United States", circuit: "Circuit of the Americas", sprint: false, quCT: "Sat Oct 24, 4:00 PM CT", raceCT: "Sun Oct 25, 3:00 PM CT" },
  { id: "MEX", name: "Mexico", circuit: "Autodromo Hermanos Rodriguez", sprint: false, quCT: "Sat Oct 31, 4:00 PM CT", raceCT: "Sun Nov 1, 3:00 PM CT" },
  { id: "BRA", name: "Brazil", circuit: "Interlagos", sprint: false, quCT: "Sat Nov 7, 12:00 PM CT", raceCT: "Sun Nov 8, 11:00 AM CT" },
  { id: "LVS", name: "Las Vegas", circuit: "Las Vegas Strip", sprint: false, quCT: "Fri Nov 20, 10:00 PM CT", raceCT: "Sat Nov 21, 10:00 PM CT" },
  { id: "QAT", name: "Qatar", circuit: "Losail", sprint: false, quCT: "Sat Nov 28, 12:00 PM CT", raceCT: "Sun Nov 29, 10:00 AM CT" },
  { id: "ABD", name: "Abu Dhabi", circuit: "Yas Marina", sprint: false, quCT: "Sat Dec 5, 8:00 AM CT", raceCT: "Sun Dec 6, 7:00 AM CT" },
]

export default function Schedule({ session, player }) {
  const now = new Date()

  return (
    <Layout session={session} player={player}>
      <div className="fade-up">
        <div className="mb-5">
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",letterSpacing:"3px"}}>2026 SCHEDULE</h1>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:"#aaa",marginTop:"4px"}}>All times Central (CT)</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {SCHEDULE.map((race, i) => {
            const raceData = RACES.find(r => r.id === race.id)
            const raceDate = new Date(race.raceCT.replace(' CT','') + ' 2026')
            const isPast = raceDate < now
            const isNext = !isPast && SCHEDULE.slice(0,i).every(r => new Date(r.raceCT.replace(' CT','') + ' 2026') < now)
            const trackFile = raceData ? TRACK_FILES[raceData.country] : null
            const flag = raceData?.flag || ''

            return (
              <div key={race.id}
                style={{
                  background: isNext ? '#16161e' : isPast ? '#0d0d12' : '#111118',
                  border: isNext ? '1px solid #E8002D' : '1px solid #1e1e2c',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  opacity: isPast ? 0.5 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}>

                {/* Track outline background */}
                {trackFile && (
                  <div style={{
                    position:'absolute', right:'-10px', top:'50%', transform:'translateY(-50%)',
                    opacity: isNext ? 0.12 : 0.06, pointerEvents:'none'
                  }}>
                    <img src={trackFile} alt="" width="90" height="90"
                      style={{filter: isNext
                        ? 'brightness(0) saturate(100%) invert(12%) sepia(95%) saturate(7000%) hue-rotate(347deg)'
                        : 'brightness(0) invert(1)'}} />
                  </div>
                )}

                {isNext && (
                  <div style={{
                    position:'absolute',top:'-1px',left:'16px',
                    background:'#E8002D',color:'#fff',
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:'0.65rem',
                    letterSpacing:'2px',padding:'2px 10px',borderRadius:'0 0 4px 4px'
                  }}>NEXT RACE</div>
                )}

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px',position:'relative',zIndex:1}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px', marginTop: isNext ? '8px' : 0}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:'#aaa',minWidth:'22px'}}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      <span style={{fontSize:'1.3rem',lineHeight:1}}>{flag}</span>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.15rem',letterSpacing:'2px',color: isPast ? '#888' : '#eef0f5'}}>
                        {race.name.toUpperCase()}
                      </span>
                      {race.sprint && (
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.5rem',
                          background:'#1a1a2e',border:'1px solid #2e2e5a',color:'#8888ff',
                          padding:'1px 6px',borderRadius:'3px',letterSpacing:'1px'}}>SPRINT</span>
                      )}
                      {isPast && (
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.5rem',
                          background:'#1a2e1a',border:'1px solid #2e5a2e',color:'#4a9a4a',
                          padding:'1px 6px',borderRadius:'3px'}}>✓</span>
                      )}
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.58rem',color:'#888',marginLeft:'56px',marginTop:'3px'}}>
                      {race.circuit}
                    </div>
                  </div>

                  <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.5rem',color:'#888',marginBottom:'2px',letterSpacing:'1px'}}>QUALI</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.65rem',color: isPast ? '#666' : '#aaa'}}>{race.quCT}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.5rem',color:'#888',marginBottom:'2px',letterSpacing:'1px'}}>RACE</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.7rem',color: isPast ? '#666' : isNext ? '#E8002D' : '#eef0f5',fontWeight: isNext ? 700 : 400}}>{race.raceCT}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
