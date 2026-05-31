import { useState, useEffect, useRef } from "react"

export default function App() {
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeMode, setActiveMode] = useState(null)
  const [flags, setFlags] = useState([])
  const [error, setError] = useState("")
  const [nudgeCount, setNudgeCount] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [matrixChars, setMatrixChars] = useState([])
  const recognitionRef = useRef(null)
  const transcriptRef = useRef("")
  const timerRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (e) => {
      let full = ""
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript
      setTranscript(full)
      transcriptRef.current = full
    }
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cols = Math.floor(canvas.width / 20)
    const drops = Array(cols).fill(1)
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF"

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#00ff41"
      ctx.font = "14px monospace"
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = Math.random() > 0.95 ? "#ffffff" : `rgba(0,${Math.floor(Math.random()*100)+155},65,${Math.random()*0.5+0.3})`
        ctx.fillText(char, i * 20, y * 20)
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    animRef.current = setInterval(draw, 50)
    return () => clearInterval(animRef.current)
  }, [])

  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isListening])

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
      setTranscript("")
      transcriptRef.current = ""
      setResponse("")
      setError("")
      setSessionTime(0)
      setActiveMode(null)
    }
  }

  const getNudge = async (mode) => {
    const text = transcriptRef.current || transcript
    if (!text.trim()) { setError("START LISTENING FIRST_"); return }
    setError("")
    setIsLoading(true)
    setActiveMode(mode)
    const prompts = {
      explain: `A professor just said: "${text}". Explain the key concept in 2-3 simple sentences a student can understand instantly.`,
      catchup: `Lecture so far: "${text}". Give exactly 3 bullet points summarizing key points. One sentence each. Use • as bullet.`,
      flag: `Professor said: "${text}". What is the single most important thing to remember? One sentence. Start with "Key point:"`
    }
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[mode] })
      })
      const data = await res.json()
      if (data.error) { setError(data.error) } else {
        setResponse(data.text)
        setNudgeCount(c => c + 1)
        if (mode === "flag") {
          setFlags(prev => [...prev, {
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            note: data.text
          }])
        }
      }
    } catch (e) { setError("CONNECTION ERROR_") }
    setIsLoading(false)
  }

  const modeConfig = {
    explain: { label: "EXPLAIN", desc: "Decode what was just said", icon: ">" },
    catchup: { label: "CATCH_UP", desc: "Compile lecture so far", icon: ">>" },
    flag: { label: "FLAG", desc: "Mark critical data", icon: "!!" }
  }

  const exampleOutputs = {
    explain: '"Photosynthesis converts light energy into glucose using CO2 and water..."',
    catchup: "• Krebs cycle produces ATP\n• Mitochondria is the powerhouse\n• Glucose is broken down",
    flag: '"Key point: This concept will appear on the final exam."'
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      {/* Matrix canvas */}
      <canvas ref={canvasRef} style={{
        position: "fixed", inset: 0, zIndex: 0, opacity: 0.4, pointerEvents: "none"
      }}/>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "460px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            fontSize: "42px", fontWeight: "400", color: "#00ff41",
            letterSpacing: "0.3em", lineHeight: 1,
            textShadow: "0 0 20px rgba(0,255,65,0.8), 0 0 40px rgba(0,255,65,0.4)"
          }}>NUDGE</div>
          <div style={{ fontSize: "11px", color: "#00aa2a", marginTop: "6px", letterSpacing: "0.2em" }}>
            SILENT_AI_FOR_STUDENTS // v1.0
          </div>
          <div style={{ fontSize: "11px", color: "#005a15", marginTop: "4px", letterSpacing: "0.15em" }}>
            REAL-TIME LECTURE COMPANION — INVISIBLE MODE ACTIVE
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: "rgba(0,8,0,0.92)",
          borderRadius: "4px",
          border: "1px solid #00ff41",
          overflow: "hidden",
          boxShadow: "0 0 30px rgba(0,255,65,0.15), inset 0 0 30px rgba(0,255,65,0.03)"
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #003a10",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(0,255,65,0.03)"
          }}>
            <div>
              <div style={{
                fontSize: "12px", color: isListening ? "#00ff41" : "#005a15",
                letterSpacing: "0.2em",
                textShadow: isListening ? "0 0 10px rgba(0,255,65,0.8)" : "none",
                transition: "all 0.3s"
              }}>
                {isListening ? `>> LISTENING... [${formatTime(sessionTime)}]` : ">> STANDBY"}
              </div>
              <div style={{ fontSize: "10px", color: "#003a10", marginTop: "2px", letterSpacing: "0.15em" }}>
                {isListening ? "CAPTURING AUDIO STREAM" : "AWAITING INPUT"}
              </div>
            </div>
            <button onClick={toggleListen} style={{
              padding: "9px 20px",
              border: isListening ? "1px solid #ff4141" : "1px solid #00ff41",
              background: "transparent",
              color: isListening ? "#ff4141" : "#00ff41",
              fontSize: "12px", letterSpacing: "0.15em",
              cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'Share Tech Mono', monospace",
              boxShadow: isListening ? "0 0 10px rgba(255,65,65,0.3)" : "0 0 10px rgba(0,255,65,0.3)",
              borderRadius: "2px"
            }}>
              {isListening ? "[ STOP ]" : "[ START ]"}
            </button>
          </div>

          {/* Transcript */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #003a10", minHeight: "80px" }}>
            <div style={{ fontSize: "10px", color: "#005a15", letterSpacing: "0.2em", marginBottom: "10px" }}>
              // AUDIO_TRANSCRIPT
              {isListening && transcript && <span style={{ color: "#00ff41", marginLeft: "8px", animation: "blink 1s infinite" }}>█</span>}
            </div>
            <div style={{
              fontSize: "13px", color: transcript ? "#00cc34" : "#003a10",
              lineHeight: "1.7", letterSpacing: "0.05em",
              display: "-webkit-box",
              WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"
            }}>
              {transcript || '> click [ START ] and speak\n> nudge captures your lecture silently\n> then select a mode below_'}
            </div>
          </div>

          {/* Modes */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #003a10" }}>
            <div style={{ fontSize: "10px", color: "#005a15", letterSpacing: "0.2em", marginBottom: "12px" }}>// SELECT_MODE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {Object.entries(modeConfig).map(([id, cfg]) => {
                const isActive = activeMode === id
                return (
                  <button key={id} onClick={() => getNudge(id)} disabled={isLoading} style={{
                    padding: "14px 8px",
                    border: isActive ? "1px solid #00ff41" : "1px solid #003a10",
                    background: isActive ? "rgba(0,255,65,0.08)" : "transparent",
                    color: isActive ? "#00ff41" : "#005a15",
                    cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "'Share Tech Mono', monospace",
                    opacity: isLoading && !isActive ? 0.4 : 1,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    borderRadius: "2px",
                    boxShadow: isActive ? "0 0 12px rgba(0,255,65,0.2)" : "none",
                    textShadow: isActive ? "0 0 8px rgba(0,255,65,0.6)" : "none"
                  }}>
                    <span style={{ fontSize: "16px", letterSpacing: "0.1em" }}>{cfg.icon}</span>
                    <span style={{ fontSize: "11px", letterSpacing: "0.1em" }}>{cfg.label}</span>
                    <span style={{ fontSize: "9px", opacity: 0.7, textAlign: "center", lineHeight: "1.3", letterSpacing: "0.05em" }}>{cfg.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Response */}
          <div style={{ padding: "16px 20px", minHeight: "130px" }}>
            <div style={{ fontSize: "10px", color: "#005a15", letterSpacing: "0.2em", marginBottom: "12px" }}>// NUDGE_OUTPUT</div>
            {isLoading ? (
              <div style={{ color: "#00ff41", fontSize: "13px", letterSpacing: "0.1em" }}>
                <span style={{ animation: "blink 0.5s infinite" }}>█</span> PROCESSING...
              </div>
            ) : error ? (
              <div style={{
                fontSize: "13px", color: "#ff4141", letterSpacing: "0.05em", lineHeight: "1.7",
                padding: "12px 14px", border: "1px solid rgba(255,65,65,0.3)", borderRadius: "2px",
                background: "rgba(255,65,65,0.05)"
              }}>ERROR: {error}</div>
            ) : response ? (
              <div style={{
                fontSize: "13px", color: "#00ff41", lineHeight: "1.8",
                whiteSpace: "pre-wrap", letterSpacing: "0.03em",
                padding: "14px 16px", border: "1px solid #003a10", borderRadius: "2px",
                background: "rgba(0,255,65,0.04)",
                textShadow: "0 0 8px rgba(0,255,65,0.3)"
              }}>{response}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "11px", color: "#004a12", letterSpacing: "0.05em", lineHeight: "1.6" }}>
                  &gt; no output yet — start listening and select a mode
                </div>
                {Object.entries(modeConfig).map(([id, cfg]) => (
                  <div key={id} style={{
                    padding: "10px 14px", border: "1px solid #002a0a", borderRadius: "2px",
                    background: "rgba(0,255,65,0.01)"
                  }}>
                    <div style={{ fontSize: "10px", color: "#005a15", marginBottom: "4px", letterSpacing: "0.15em" }}>{cfg.icon} {cfg.label}:</div>
                    <div style={{ fontSize: "11px", color: "#004a12", fontStyle: "italic", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{exampleOutputs[id]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid #003a10",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(0,255,65,0.02)"
          }}>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ fontSize: "12px", color: nudgeCount > 0 ? "#00ff41" : "#003a10", letterSpacing: "0.1em", textShadow: nudgeCount > 0 ? "0 0 8px rgba(0,255,65,0.5)" : "none" }}>
                NUDGES: {nudgeCount}
              </div>
              <div style={{ fontSize: "12px", color: flags.length > 0 ? "#00ff41" : "#003a10", letterSpacing: "0.1em", textShadow: flags.length > 0 ? "0 0 8px rgba(0,255,65,0.5)" : "none" }}>
                FLAGS: {flags.length}
              </div>
            </div>
            <div style={{ fontSize: "10px", color: "#002a0a", letterSpacing: "0.15em" }}>SYS_OK</div>
          </div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div style={{
            marginTop: "16px",
            background: "rgba(0,8,0,0.92)",
            border: "1px solid #003a10",
            borderRadius: "4px", overflow: "hidden"
          }}>
            <div style={{
              padding: "12px 20px", borderBottom: "1px solid #003a10",
              fontSize: "10px", color: "#00ff41", letterSpacing: "0.2em"
            }}>// FLAGGED_MOMENTS [{flags.length}]</div>
            <div style={{ maxHeight: "180px", overflowY: "auto" }}>
              {flags.map((f, i) => (
                <div key={i} style={{
                  padding: "12px 20px",
                  borderBottom: i < flags.length - 1 ? "1px solid #002a0a" : "none",
                  display: "flex", gap: "14px"
                }}>
                  <div style={{ fontSize: "10px", color: "#005a15", whiteSpace: "nowrap", marginTop: "2px" }}>[{f.time}]</div>
                  <div style={{ fontSize: "12px", color: "#00aa2a", lineHeight: "1.6", letterSpacing: "0.03em" }}>{f.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        button:not(:disabled):hover { box-shadow: 0 0 20px rgba(0,255,65,0.4) !important; color: #00ff41 !important; border-color: #00ff41 !important; }
      `}</style>
    </div>
  )
}
