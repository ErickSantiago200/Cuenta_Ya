interface LogoProps {
  size?: 'md' | 'lg'
  /** `dark`: para colocar sobre fondos azul petróleo (menú y barra superior). */
  tone?: 'light' | 'dark'
}

export function Logo({ size = 'md', tone = 'light' }: LogoProps) {
  const large = size === 'lg'
  const onDark = tone === 'dark'
  return (
    <div className={`flex items-center ${large ? 'flex-col gap-3' : 'gap-3'}`}>
      <div
        className={`flex shrink-0 items-center justify-center font-extrabold shadow-card ${
          onDark ? 'bg-accent text-primary' : 'bg-primary text-accent'
        } ${large ? 'h-16 w-16 rounded-2xl text-2xl' : 'h-10 w-10 rounded-xl text-base'}`}
      >
        CY
      </div>
      <span
        className={`font-extrabold tracking-wide ${onDark ? 'text-white' : 'text-primary'} ${
          large ? 'text-2xl' : 'text-lg'
        }`}
      >
        CUENTA <span className={onDark ? 'text-accent' : 'text-action'}>YA</span>
      </span>
    </div>
  )
}
