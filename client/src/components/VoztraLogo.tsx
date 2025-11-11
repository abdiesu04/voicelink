import voztraLogoImage from "@assets/a-clean-modern-logo-design-featuring-the_U7fgc6INSwC-QPiP-z7mDQ_KE33-hesSouMk1bakN-xUw-removebg-preview (1)_1762877940367.png";

interface VoztraLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function VoztraLogo({ className = "", width = 140, height = 40 }: VoztraLogoProps) {
  return (
    <img
      src={voztraLogoImage}
      alt="Voztra"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
