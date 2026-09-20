import React from 'react';

export interface FolderIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

export const FolderIcon: React.FC<FolderIconProps> = ({
  size = 24,
  width,
  height,
  color = 'currentColor',
  style,
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? (typeof w === 'number' ? Math.round(w * (85 / 104)) : w);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 104 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M4 4L4 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M28 4L28 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M16 4L16 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M40 11L40 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M76 18L76 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M64 18L64 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M100 18L100 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M52 18L52 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M88 18L88 81" stroke={color} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
};

export default FolderIcon;
