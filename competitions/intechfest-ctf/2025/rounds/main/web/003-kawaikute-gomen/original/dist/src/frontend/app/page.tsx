"use client"
import { useEffect, useMemo, useRef, useState } from "react"

/* tiny utility */
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

/* Button (enhanced with semantic tokens) */
function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-105 hover:brightness-110",
    secondary:
      "bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:shadow-secondary/25 hover:scale-105",
    ghost: "bg-transparent text-foreground hover:bg-muted/20 hover:text-foreground",
    subtle: "bg-card text-card-foreground hover:bg-muted border border-border",
  }
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
    circleLg: "p-8",
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

/* Input (enhanced with semantic tokens) */
function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200",
        className,
      )}
      {...props}
    />
  )
}

/* helpers */
const initials = (s = "") =>
  (s || "Anon")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

/* Page */
export default function Home() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [listeners, setListeners] = useState([])
  const [userName, setUserName] = useState("")
  const [showNameModal, setShowNameModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("kawaikute-listener-name")
    if (saved) setUserName(saved)
    else setShowNameModal(true)
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsLoading(true)
    const onCanPlay = () => setIsLoading(false)
    el.addEventListener("play", onPlay)
    el.addEventListener("pause", onPause)
    el.addEventListener("waiting", onWaiting)
    el.addEventListener("canplay", onCanPlay)
    return () => {
      el.removeEventListener("play", onPlay)
      el.removeEventListener("pause", onPause)
      el.removeEventListener("waiting", onWaiting)
      el.removeEventListener("canplay", onCanPlay)
    }
  }, [])

  useEffect(() => {
    let timer
    const tick = async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          fetch("/api/listeners/count").catch(() => null),
          fetch("/api/listeners").catch(() => null),
        ])
        if (cRes?.ok) {
          const json = await cRes.json()
          setCount(Number(json.count || 0))
        }
        if (lRes?.ok) {
          const lj = await lRes.json()
          setListeners(Array.isArray(lj.listeners) ? lj.listeners : [])
        }
      } catch {
        // ignore network flakiness
      }
    }
    tick()
    timer = setInterval(tick, 3000)
    return () => clearInterval(timer)
  }, [])

  const bars = useMemo(() => new Array(24).fill(0), [])

  const toggle = async () => {
    const el = audioRef.current
    if (!el) return
    try {
      if (el.paused) {
        setIsLoading(true)
        const name = userName || "Anonymous"
        el.src = `/api/stream?id=kawaikute-gomen.mp3&name=${encodeURIComponent(name)}`
        await el.play()
      } else {
        el.pause()
      }
    } catch (e) {
      setIsLoading(false)
      console.warn("play failed", e)
    }
  }

  const saveName = (name, autoplay = false) => {
    const n = (name || "Anonymous").trim()
    setUserName(n)
    try {
      localStorage.setItem("kawaikute-listener-name", n)
    } catch {}
    setShowNameModal(false)

    if (autoplay) {
      setTimeout(() => {
        toggle()
      }, 120)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background text-foreground antialiased relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient orbs */}
        <div className="absolute left-1/4 top-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl opacity-60 animate-pulse" />
        <div className="absolute right-1/4 top-0 w-80 h-80 rounded-full bg-secondary/15 blur-3xl opacity-50 float-animation" />
        <div
          className="absolute left-1/2 bottom-1/4 w-64 h-64 rounded-full bg-accent/10 blur-2xl opacity-40 animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.02)_1px,transparent_0)] bg-[length:40px_40px]" />
      </div>

      <main className="mx-auto max-w-5xl px-6 py-16 relative z-10">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-card/50 backdrop-blur-sm border border-border px-6 py-2 shadow-lg">
            <div className="h-3 w-3 rounded-full bg-secondary animate-pulse shadow-lg shadow-secondary/50" />
            <span className="text-sm font-semibold text-secondary tracking-wider uppercase">Live Stream</span>
          </div>

          <h1 className="mt-8 text-6xl font-bold tracking-tight text-balance">
            <span className="bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-transparent [&]:text-foreground supports-[background-clip:text]:text-transparent">
              Kawaikute Gomen
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto text-pretty">
            Join the live music experience — connect with listeners worldwide
          </p>
        </header>

        <section className="mb-16 flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center group" role="region" aria-label="Player control">
            {/* Enhanced decorative rings */}
            <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            <div
              className="absolute -inset-4 rounded-full border border-primary/20 animate-spin"
              style={{ animationDuration: "20s" }}
            />
            <div
              className="absolute -inset-2 rounded-full border border-secondary/20 animate-spin"
              style={{ animationDuration: "15s", animationDirection: "reverse" }}
            />

            <div className="relative z-10">
              <Button
                onClick={toggle}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? "Pause stream" : "Play stream"}
                variant="primary"
                size="circleLg"
                className={cn(
                  "shadow-2xl shadow-primary/30 relative overflow-hidden",
                  isPlaying && "pulse-glow",
                  isLoading && "animate-pulse",
                )}
              >
                {/* Shimmer effect when loading */}
                {isLoading && <div className="absolute inset-0 shimmer-effect" />}

                {/* Enhanced Play / Pause icon */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden className="relative z-10">
                  {isPlaying ? (
                    <g fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="2" />
                      <rect x="14" y="4" width="4" height="16" rx="2" />
                    </g>
                  ) : (
                    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                  )}
                </svg>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="inline-flex items-center gap-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border px-4 py-2 shadow-lg">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="m22 21-3-3m0 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-bold text-xl text-foreground">{count}</span>
              <span className="text-muted-foreground">listening</span>
            </div>

            <button
              onClick={() => setShowNameModal(true)}
              className="flex items-center gap-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border px-4 py-2 text-sm hover:bg-card/80 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary grid place-items-center text-sm font-bold text-white shadow-lg">
                {initials(userName)}
              </span>
              <span className="truncate max-w-[140px] text-left text-foreground">{userName || "Set your name"}</span>
            </button>

            <div
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300",
                isLoading
                  ? "bg-secondary/20 text-secondary animate-pulse"
                  : isPlaying
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/20 text-muted-foreground",
              )}
            >
              {isLoading ? "Connecting..." : isPlaying ? "♪ Live" : "Paused"}
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm p-8 shadow-2xl">
            <div className="flex items-end justify-center gap-1 h-48 mb-6">
              {bars.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-4 origin-bottom rounded-t-lg transition-all duration-300"
                  style={{
                    background: `linear-gradient(180deg, 
                      hsl(var(--primary)) 0%, 
                      hsl(var(--secondary)) 50%, 
                      hsl(var(--accent)) 100%)`,
                    height: `${20 + ((i * 23) % 80)}px`,
                    transformOrigin: "bottom",
                    animation: isPlaying
                      ? `barAnim ${800 + (i % 5) * 200}ms ease-in-out ${(
                          (i % 8) * 100
                        ).toString()}ms infinite alternate`
                      : "none",
                    boxShadow: isPlaying ? "0 8px 25px rgba(8, 145, 178, 0.15)" : "0 4px 15px rgba(8, 145, 178, 0.05)",
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Audio Visualizer</p>
              <p className="text-xs text-muted-foreground">
                {isPlaying ? "Reacting to live audio stream" : "Start playing to see the magic"}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Live Audience</h3>
            <p className="text-muted-foreground">Music lovers from around the world</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {listeners.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted/20 to-muted/10 border-2 border-dashed border-muted flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground">Be the first to join the party!</p>
              </div>
            )}
            {listeners.map((l, idx) => {
              const joined = l.since_unix_ms ? new Date(Number(l.since_unix_ms)).toLocaleTimeString() : ""
              return (
                <div key={l.id || idx} className="relative flex flex-col items-center gap-2 group">
                  <div
                    title={`${l.name || l.id} ${joined ? `— joined ${joined}` : ""}`}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 border-2 border-primary/30 text-white font-bold shadow-xl shadow-primary/20 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/30 cursor-pointer"
                  >
                    {initials(l.name || l.id)}
                  </div>
                  <div className="max-w-[80px] text-xs text-center text-muted-foreground truncate group-hover:text-foreground transition-colors">
                    {(l.name || "Anon").slice(0, 12)}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-background animate-pulse" />
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <audio ref={audioRef} preload="none" className="hidden" />

      {showNameModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-md px-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowNameModal(false)
          }}
        >
          <div className="mx-auto w-full max-w-md rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border p-8 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-2xl font-bold text-foreground">Join the Stream</h4>
              <button
                aria-label="Close"
                onClick={() => setShowNameModal(false)}
                className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-muted-foreground text-pretty">
              Choose a display name to connect with other music lovers. Your name will be visible to everyone in the
              live audience.
            </p>
            <div className="mb-6">
              <Input
                placeholder="Enter your name (e.g. Alex, MusicLover)"
                defaultValue={userName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveName(e.target.value || "Anonymous", true)
                  }
                }}
                id="listener-name"
                className="text-base"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="md" onClick={() => saveName("Anonymous", true)} className="flex-1">
                Join Anonymously
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  const inputElement = document.getElementById("listener-name") as HTMLInputElement | null;
                  const val = inputElement?.value;
                  saveName(val || "Anonymous", true);
                }}
              >
                Join & Play ♪
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
