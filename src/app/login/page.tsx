'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import s from './login.module.css'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = ({ off }: { off?: boolean }) => off ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconLogin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)
const IconRegister = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
)
const IconCheck = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function passwordStrength(val: string) {
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  return score
}

const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat']
const strengthColor = ['', '#ff5c5c', '#f5a623', '#22d3a5', '#22d3a5']

// ─── Shared input style ───────────────────────────────────────────────────────
const inputBase = {
  width: '100%',
  background: '#1c2338',
  border: '1.5px solid rgba(255,255,255,0.10)',
  borderRadius: '12px',
  padding: '11px 14px 11px 40px',
  color: '#e8eaf6',
  fontFamily: 'var(--font-dm-sans), sans-serif',
  fontSize: '14px',
  outline: 'none',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  // login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)

  // register state
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState(false)

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPass }),
    })
    const data = await res.json()
    if (!res.ok) { setLoginError(data.error || 'Login gagal'); setLoginLoading(false); return }
    localStorage.setItem('token', data.token)
    router.push('/')
  }

  const handleRegister = async () => {
    setRegLoading(true)
    setRegError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmail, password: regPass }),
    })
    const data = await res.json()
    setRegLoading(false)
    if (!res.ok) { setRegError(data.error || 'Registrasi gagal'); return }
    setRegSuccess(true)
  }

  const strength = passwordStrength(regPass)

  return (
    <div
      className={s.noise}
      style={{
        width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden',
        background: '#0a0d14', color: '#e8eaf6',
        fontFamily: 'var(--font-dm-sans), sans-serif',
      }}
    >
      {/* ── LEFT: Brand Panel ── */}
      <div
        className={s.brandPanel}
        style={{
          width: '48%', minWidth: 400, height: '100%',
          background: '#111520',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '40px 48px', flexShrink: 0,
        }}
      >
        {/* Right edge separator */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 1, height: '100%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(79,124,255,0.4) 30%, rgba(124,92,252,0.4) 70%, transparent 100%)',
          zIndex: 1,
        }} />

        {/* Logo */}
        <div className={s.slideLeft} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
          <div
            className={s.logoMark}
            style={{
              width: 42, height: 42,
              background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(79,124,255,0.4)',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11L9 16L18 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 22,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MongoDB Editor</span>
          <span style={{
            background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
            color: 'white', fontSize: 9, fontWeight: 800,
            padding: '3px 7px', borderRadius: 99, letterSpacing: 1,
          }}>DEV</span>
        </div>

        {/* Hero */}
        <div className={s.slideLeft1} style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 16,
          }}>
            Manage data.<br />
            Query lebih{' '}
            <span style={{
              background: 'linear-gradient(135deg, #4f7cff 0%, #7c5cfc 50%, #22d3a5 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>cepat.</span><br />
            Kolaborasi real-time.
          </h1>
          <p style={{ fontSize: 15, color: '#8892b0', lineHeight: 1.6, maxWidth: 380, marginBottom: 36 }}>
            Visual editor untuk MongoDB — browse collections, edit dokumen, query dengan filter, dan pantau perubahan lewat audit log.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: 'fi-blue', color: '#4f7cff', bg: 'rgba(79,124,255,0.12)', cls: s.feat1, text: <><strong style={{color:'#e8eaf6'}}>Visual Table View</strong> — browse & edit dokumen seperti spreadsheet</> },
              { icon: 'fi-purple', color: '#7c5cfc', bg: 'rgba(124,92,252,0.12)', cls: s.feat2, text: <><strong style={{color:'#e8eaf6'}}>Real-time Sync</strong> — perubahan langsung terlihat semua user</> },
              { icon: 'fi-green', color: '#22d3a5', bg: 'rgba(34,211,165,0.12)', cls: s.feat3, text: <><strong style={{color:'#e8eaf6'}}>Audit Log</strong> — histori setiap perubahan dokumen</> },
              { icon: 'fi-orange', color: '#f5a623', bg: 'rgba(245,166,35,0.12)', cls: s.feat4, text: <><strong style={{color:'#e8eaf6'}}>Multi-Room</strong> — isolasi database per project / tim</> },
            ].map((f, i) => (
              <div key={i} className={f.cls} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: f.bg, color: f.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {i === 0 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>}
                  {i === 1 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                  {i === 2 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                  {i === 3 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                </div>
                <span style={{ fontSize: 13.5, color: '#8892b0', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Floating cards */}
          <div style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 3 }}>
            {[
              { cls: s.floatCard1, label: 'Collections', value: '12', color: '#4f7cff', trend: '3 active rooms', extra: null },
              { cls: s.floatCard2, label: 'Documents', value: '4,820', color: '#22d3a5', trend: '↑ +128 today', extra: 15, offset: true },
              { cls: s.floatCard3, label: 'Audit Logs', value: '340', color: '#7c5cfc', trend: 'last 7 days', extra: null },
            ].map((c, i) => (
              <div
                key={i}
                className={c.cls}
                style={{
                  background: 'rgba(22,27,46,0.9)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 12, padding: '12px 16px',
                  backdropFilter: 'blur(20px)',
                  width: 160,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  transform: c.offset ? 'translateX(15px)' : undefined,
                }}
              >
                <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 10, marginTop: 2, color: '#22d3a5', display: 'flex', alignItems: 'center', gap: 3 }}>{c.trend}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer testimonial */}
        <div className={s.slideLeft2} style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '16px 18px', marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#8892b0', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 10 }}>
              "MongoDB Editor sangat membantu tim kami debug data production langsung tanpa perlu akses terminal."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>AR</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Andi Rahmat</div>
                <div style={{ fontSize: 11, color: '#4a5568' }}>Backend Engineer, Startup X</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#f5a623' }}>★★★★★</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['50+', 'Collections'], ['99.9%', 'Uptime'], ['Real-time', 'Sync']].map(([val, label]) => (
              <div key={label}>
                <div style={{
                  fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 800,
                  background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{val}</div>
                <div style={{ fontSize: 11, color: '#4a5568' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth Panel ── */}
      <div style={{
        flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, position: 'relative', overflowY: 'auto',
      }}>
        {/* Spotlight */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(79,124,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className={s.cardIn} style={{ width: '100%', maxWidth: 420 }}>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: '#161b2e',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 4, marginBottom: 28, position: 'relative',
          }}>
            <div
              className={s.tabSlider}
              style={{ transform: tab === 'register' ? 'translateX(100%)' : undefined }}
            />
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '10px', textAlign: 'center',
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', borderRadius: 10,
                  color: tab === t ? '#e8eaf6' : '#4a5568',
                  background: 'none', border: 'none',
                  position: 'relative', zIndex: 1,
                  transition: 'color 0.2s',
                }}
              >
                {t === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <div className={s.panelIn}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6, lineHeight: 1.2,
                }}>
                  Selamat{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Datang</span> 👋
                </h2>
                <p style={{ fontSize: 14, color: '#8892b0', lineHeight: 1.5 }}>Masuk ke dashboard dan mulai kelola data MongoDB-mu.</p>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8892b0', letterSpacing: 0.3, marginBottom: 7 }}>Alamat Email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', display: 'flex', alignItems: 'center' }}>
                    <IconMail />
                  </div>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={inputBase}
                    onFocus={e => { e.target.style.borderColor = '#4f7cff'; e.target.style.boxShadow = '0 0 0 3px rgba(79,124,255,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8892b0', letterSpacing: 0.3, marginBottom: 7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', display: 'flex', alignItems: 'center' }}>
                    <IconLock />
                  </div>
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ ...inputBase, paddingRight: 40 }}
                    onFocus={e => { e.target.style.borderColor = '#4f7cff'; e.target.style.boxShadow = '0 0 0 3px rgba(79,124,255,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    onClick={() => setShowLoginPass(v => !v)}
                    style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center' }}
                  >
                    <IconEye off={showLoginPass} />
                  </button>
                </div>
              </div>

              {/* Remember + error */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, marginTop: 4 }}>
                <div
                  onClick={() => setRemember(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: remember ? '#4f7cff' : '#1c2338',
                    border: `1.5px solid ${remember ? '#4f7cff' : 'rgba(255,255,255,0.10)'}`,
                    transition: 'all 0.15s',
                  }}>
                    {remember && <IconCheck />}
                  </div>
                  <span style={{ fontSize: 13, color: '#8892b0', userSelect: 'none' }}>Ingat saya</span>
                </div>
              </div>

              {loginError && (
                <div style={{ fontSize: 13, color: '#ff5c5c', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,92,92,0.08)', borderRadius: 8, border: '1px solid rgba(255,92,92,0.2)' }}>
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className={s.btnCta}
                style={{
                  width: '100%', padding: 13,
                  background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
                  border: 'none', borderRadius: 12,
                  color: 'white',
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 15, fontWeight: 700, cursor: loginLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginBottom: 20, position: 'relative', overflow: 'hidden',
                  transition: 'all 0.2s',
                  opacity: loginLoading ? 0.8 : 1,
                }}
                onMouseEnter={e => { if (!loginLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(79,124,255,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
              >
                {loginLoading ? <><div className={s.spinner} /> Memverifikasi...</> : <><IconLogin /> Masuk ke Dashboard</>}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13.5, color: '#4a5568' }}>
                Belum punya akun?{' '}
                <span
                  onClick={() => setTab('register')}
                  style={{ color: '#4f7cff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Daftar sekarang gratis →
                </span>
              </div>
            </div>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <div className={s.panelIn}>
              {regSuccess ? (
                /* Success state */
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div
                    className={s.popIn}
                    style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'rgba(34,211,165,0.08)',
                      border: '2px solid rgba(34,211,165,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3a5" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Akun Berhasil Dibuat! 🎉</h3>
                  <p style={{ fontSize: 13.5, color: '#8892b0', lineHeight: 1.5, marginBottom: 28 }}>Akun kamu sudah siap. Silakan masuk untuk mulai menggunakan MongoDB Editor.</p>
                  <button
                    onClick={() => { setTab('login'); setRegSuccess(false) }}
                    className={s.btnCta}
                    style={{
                      width: '100%', padding: 13,
                      background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
                      border: 'none', borderRadius: 12, color: 'white',
                      fontFamily: 'var(--font-syne), sans-serif',
                      fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <IconLogin /> Lanjut ke Login
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 28 }}>
                    <h2 style={{
                      fontFamily: 'var(--font-syne), sans-serif',
                      fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6, lineHeight: 1.2,
                    }}>
                      Buat Akun{' '}
                      <span style={{ background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gratis</span>
                    </h2>
                    <p style={{ fontSize: 14, color: '#8892b0', lineHeight: 1.5 }}>Setup dalam hitungan detik, langsung akses semua fitur.</p>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8892b0', letterSpacing: 0.3, marginBottom: 7 }}>Alamat Email</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', display: 'flex', alignItems: 'center' }}>
                        <IconMail />
                      </div>
                      <input
                        type="email"
                        placeholder="nama@email.com"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        style={inputBase}
                        onFocus={e => { e.target.style.borderColor = '#4f7cff'; e.target.style.boxShadow = '0 0 0 3px rgba(79,124,255,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8892b0', letterSpacing: 0.3, marginBottom: 7 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', display: 'flex', alignItems: 'center' }}>
                        <IconLock />
                      </div>
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        placeholder="Min. 8 karakter"
                        value={regPass}
                        onChange={e => setRegPass(e.target.value)}
                        style={{ ...inputBase, paddingRight: 40 }}
                        onFocus={e => { e.target.style.borderColor = '#4f7cff'; e.target.style.boxShadow = '0 0 0 3px rgba(79,124,255,0.1)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                      />
                      <button
                        onClick={() => setShowRegPass(v => !v)}
                        style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center' }}
                      >
                        <IconEye off={showRegPass} />
                      </button>
                    </div>
                    {/* Strength meter */}
                    {regPass.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            height: 3, flex: 1, borderRadius: 99,
                            background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.06)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                        <span style={{ fontSize: 10, marginLeft: 4, fontWeight: 600, color: strengthColor[strength] }}>
                          {strengthLabel[strength]}
                        </span>
                      </div>
                    )}
                  </div>

                  {regError && (
                    <div style={{ fontSize: 13, color: '#ff5c5c', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,92,92,0.08)', borderRadius: 8, border: '1px solid rgba(255,92,92,0.2)' }}>
                      {regError}
                    </div>
                  )}

                  <button
                    onClick={handleRegister}
                    disabled={regLoading}
                    className={s.btnCta}
                    style={{
                      width: '100%', padding: 13,
                      background: 'linear-gradient(135deg, #4f7cff, #7c5cfc)',
                      border: 'none', borderRadius: 12, color: 'white',
                      fontFamily: 'var(--font-syne), sans-serif',
                      fontSize: 15, fontWeight: 700, cursor: regLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      marginBottom: 20, position: 'relative', overflow: 'hidden',
                      transition: 'all 0.2s', opacity: regLoading ? 0.8 : 1,
                    }}
                    onMouseEnter={e => { if (!regLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(79,124,255,0.4)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
                  >
                    {regLoading ? <><div className={s.spinner} /> Membuat akun...</> : <><IconRegister /> Buat Akun Gratis</>}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: 13.5, color: '#4a5568' }}>
                    Sudah punya akun?{' '}
                    <span
                      onClick={() => setTab('login')}
                      style={{ color: '#4f7cff', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Masuk di sini
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
