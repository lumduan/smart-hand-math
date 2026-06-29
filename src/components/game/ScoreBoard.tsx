interface ScoreBoardProps {
  score: number
  best?: number
  streak?: number
}

/** Compact score / best / streak panel shown during a game. */
export function ScoreBoard({ score, best, streak = 0 }: ScoreBoardProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="badge badge-lg badge-primary gap-1 font-display">
        <span className="text-lg">⭐</span>
        <span className="text-lg font-bold tabular-nums">{score}</span>
      </div>
      {streak > 1 && (
        <div className="badge badge-lg badge-accent font-display animate-pop">
          🔥 {streak}
        </div>
      )}
      {best !== undefined && (
        <div className="badge badge-lg badge-ghost font-display">🏆 {best}</div>
      )}
    </div>
  )
}
