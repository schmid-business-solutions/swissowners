type P = { size?: number; color?: string };

const S = ({ size = 16, children, stroke = 2.4, color = "currentColor" }: { size?: number; children: React.ReactNode; stroke?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    {children}
  </svg>
);

export const Check = ({ size = 14 }: P) => <S size={size} stroke={3}><path d="M5 12l5 5 9-10" /></S>;
export const Arrow = ({ size = 16 }: P) => <S size={size}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const Back = ({ size = 16 }: P) => <S size={size}><path d="M19 12H5M11 6l-6 6 6 6" /></S>;
export const Lock = ({ size = 22, color }: P) => <S size={size} stroke={2} color={color}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>;
export const Shield = ({ size = 26 }: P) => <S size={size} stroke={2} color="var(--red)"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></S>;
export const Tag = ({ size = 26 }: P) => <S size={size} stroke={2} color="var(--red)"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></S>;
export const Home = ({ size = 26 }: P) => <S size={size} stroke={2} color="var(--red)"><path d="M4 21V9l8-6 8 6v12" /><path d="M9 21v-6h6v6" /></S>;
export const Info = ({ size = 22 }: P) => <S size={size} stroke={2}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></S>;
export const Close = ({ size = 22 }: P) => <S size={size} stroke={2.2}><path d="M6 6l12 12M18 6L6 18" /></S>;
export const Search = ({ size = 20 }: P) => <S size={size}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></S>;
export const Heart = ({ size = 20 }: P) => <S size={size} stroke={2}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></S>;
export const User = ({ size = 22 }: P) => <S size={size} stroke={2}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></S>;
export const Menu = ({ size = 26 }: P) => <S size={size} stroke={2.2}><path d="M4 7h16M4 12h16M4 17h16" /></S>;
export const Star = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flex: "none" }}>
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
  </svg>
);
export const Cross = ({ size = 19 }: P) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 3h5v4.5H17v5h-4.5V17h-5v-4.5H3v-5h4.5z" fill="#FFFFFF" /></svg>
);
