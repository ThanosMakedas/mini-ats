export function Spinner() {
  return (
    <div className="flex justify-center p-12" role="status" aria-label="Laddar">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  )
}
