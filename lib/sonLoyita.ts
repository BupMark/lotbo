export function jouerBipLoyita() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const oscillateur = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillateur.type = 'sine'
    oscillateur.frequency.setValueAtTime(700, ctx.currentTime)
    oscillateur.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

    oscillateur.connect(gain)
    gain.connect(ctx.destination)

    oscillateur.start(ctx.currentTime)
    oscillateur.stop(ctx.currentTime + 0.18)
  } catch {
    /* silencieux — autoplay bloqué ou API non supportée */
  }
}
