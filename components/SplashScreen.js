export default function SplashScreen({ label = 'Owomi' }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite" aria-label={`${label} loading`}>
      <div className="logo-wrap">
        <img src="/owomi-logo.svg" alt="Owomi logo" className="logo-image" />
      </div>
      <p>{label}</p>

      <style jsx>{`
        .splash-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: linear-gradient(135deg, #eef8f2 0%, #f6fbf8 100%);
        }
        .logo-wrap {
          width: 96px;
          height: 96px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          box-shadow: 0 16px 34px rgba(0, 90, 57, 0.14);
          animation: pulse 1.4s ease-in-out infinite;
        }
        .logo-image {
          width: 64px;
          height: 64px;
        }
        p {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0f7a52;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
    </div>
  )
}
