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
  const recognitionRef = useRef(null)
  const transcriptRef = useRef("")

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (e) => {
      let full = ""
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript
      }
      setTranscript(full)
      transcriptRef.current = full
    }
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
  }, [])

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
    }
  }

  const getNudge = async (mode) => {
    const text = transcriptRef.current || transcript
    if (!text.trim()) {
      setError("Say something first, then click a mode.")
      return
    }
    setError("")
    setIsLoading(true)
    setActiveMode(mode)

    const prompts = {
      explain: `A professor just said: "${text}". Explain the key concept in 2-3 simple sentences a student can understand instantly. Be direct and clear.`,
      catchup: `Lecture so far: "${text}". Give exactly 3 bullet points summarizing the key points. One sentence each. Use • as bullet.`,
      flag: `Professor said: "${text}". What is the single most important thing to remember? One sentence only. Start with "Key point:"`
    }

    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[mode] })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResponse(data.text)
        setNudgeCount(c => c + 1)
        if (mode === "flag") {
          setFlags(prev => [...prev, {
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            note: data.text
          }])
        }
      }
    } catch (e) {
      setError("Connection error. Try again.")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4" style={{fontFamily: "'DM Mono', monospace"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700&display=swap" rel="stylesheet" />

      <div className="w-80 bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] overflow-hidden">

        {/* Header */}
        <div className="bg-[#080808] px-4 py-3 flex items-center justify-between border-b border-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isListening ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]" : "bg-[#222]"}`}/>
            <span className="text-[#e0e0e0] text-sm font-bold tracking-[0.15em]" style={{fontFamily: "'Syne', sans-serif"}}>NUDGE</span>
          </div>
          <div className="flex items-center gap-2.5">
            {nudgeCount > 0 && <span className="text-[#2a2a2a] text-[10px]">{nudgeCount} nudges</span>}
            <button onClick={toggleListen} className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
              isListening ? "border-green-500 text-green-400 bg-green-950" : "border-[#222] text-[#404040] hover:border-[#333] hover:text-[#606060]"
            }`}>
              {isListening ? "● live" : "start"}
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div className="px-4 py-3 border-b border-[#141414] min-h-16">
          <div className="text-[#282828] text-[9px] tracking-[0.15em] mb-1.5">HEARING</div>
          <div className="text-[#484848] text-[11px] leading-relaxed italic line-clamp-3">
            {transcript || "Click start and speak — Nudge listens silently..."}
          </div>
        </div>

        {/* Response */}
        <div className="px-4 py-3 border-b border-[#141414] min-h-24">
          <div className="text-[#282828] text-[9px] tracking-[0.15em] mb-1.5">NUDGE</div>
          {isLoading ? (
            <div className="flex gap-1.5 pt-1">
              {[0,150,300].map(d => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bg-green-400" style={{animation:`bounce 1s ${d}ms infinite`}}/>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-[11px] leading-relaxed">{error}</div>
          ) : (
            <div className="text-[#d0d0d0] text-[11px] leading-[1.8] whitespace-pre-wrap">
              {response || "Hit a mode below to get your first nudge..."}
            </div>
          )}
        </div>

        {/* Modes */}
        <div className="flex gap-2 px-4 py-3 border-b border-[#141414]">
          {[
            {id:"explain", label:"explain"},
            {id:"catchup", label:"catch up"},
            {id:"flag", label:"flag"}
          ].map(({id, label}) => (
            <button key={id} onClick={() => getNudge(id)} disabled={isLoading} className={`flex-1 py-1.5 rounded-lg text-[10px] border transition-all disabled:opacity-40 tracking-wide ${
              activeMode === id && response
                ? "border-green-500 text-green-400 bg-green-950"
                : "border-[#1e1e1e] text-[#383838] hover:border-[#2a2a2a] hover:text-[#505050]"
            }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div className="px-4 py-3 max-h-36 overflow-y-auto">
            <div className="text-[#282828] text-[9px] tracking-[0.15em] mb-2">FLAGGED</div>
            {flags.map((f, i) => (
              <div key={i} className={`pb-2 mb-2 ${i < flags.length-1 ? "border-b border-[#141414]" : ""}`}>
                <div className="text-[#282828] text-[9px] mb-0.5">{f.time}</div>
                <div className="text-[#585858] text-[10px] leading-relaxed">{f.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#111] text-center">
          <span className="text-[#1e1e1e] text-[9px] tracking-widest">nudge — silent AI for students</span>
        </div>

      </div>
    </div>
  )
}
