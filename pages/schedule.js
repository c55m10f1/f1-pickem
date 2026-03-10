import Layout from '../components/Layout'
import { RACES } from '../lib/data'

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
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:"#444",marginTop:"4px"}}>All times Central (CT)</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {SCHEDULE.map((race, i) => {
            const raceDate = new Date(race.raceCT.replace(' CT','') + ' 2026')
            const isPast = raceDate < now
            const isNext = !isPast && SCHEDULE.slice(0,i).every(r => new Date(r.raceCT.replace(' CT','') + ' 2026') < now)

            return (
              <div key={race.id}
                style={{
                  background: isNext ? '#16161e' : isPast ? '#0d0d12' : '#111118',
                  border: isNext ? '1px solid #E8002D' : '1px solid #1e1e2c',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  opacity: isPast ? 0.5 : 1,
                  position: 'relative',
                }}>

                {isNext && (
                  <div style={{
                    position:'absolute',top:'-10px',left:'16px',
                    background:'#E8002D',color:'#fff',
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:'0.7rem',
                    letterSpacing:'2px',padding:'1px 8px',borderRadius:'3px'
                  }}>NEXT RACE</div>
                )}

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#444',minWidth:'28px'}}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.1rem',letterSpacing:'2px',color: isPast ? '#555' : '#eef0f5'}}>
                        {race.name}
                      </span>
                      {race.sprint && (
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.55rem',
                          background:'#1a1a2e',border:'1px solid #2e2e5a',color:'#8888ff',
                          padding:'1px 5px',borderRadius:'3px'}}>SPRINT</span>
                      )}
                      {isPast && (
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.55rem',
                          background:'#1a2e1a',border:'1px solid #2e5a2e',color:'#4a9a4a',
                          padding:'1px 5px',borderRadius:'3px'}}>✓ DONE</span>
                      )}
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.6rem',color:'#444',marginLeft:'36px',marginTop:'2px'}}>
                      {race.circuit}
                    </div>
                  </div>

                  <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.55rem',color:'#444',marginBottom:'2px'}}>QUALIFYING</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.7rem',color: isPast ? '#444' : '#aaa'}}>{race.quCT}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.55rem',color:'#444',marginBottom:'2px'}}>RACE</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.75rem',color: isPast ? '#444' : isNext ? '#E8002D' : '#eef0f5',fontWeight: isNext ? 700 : 400}}>{race.raceCT}</div>
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
