import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  size?: number;
};

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 20 20",
  fill: "none" as const,
});

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CheckIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M4 10.5L8 14.5L16 6" {...stroke} />
    </svg>
  );
}

export function CloseIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M5 5L15 15M15 5L5 15" {...stroke} />
    </svg>
  );
}

export function LockIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" {...stroke} />
      <path d="M7 9V6.5C7 4.84315 8.34315 3.5 10 3.5C11.6569 3.5 13 4.84315 13 6.5V9" {...stroke} />
    </svg>
  );
}

export function ClockIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <circle cx="10" cy="10" r="7" {...stroke} />
      <path d="M10 6.5V10L12.5 11.5" {...stroke} />
    </svg>
  );
}

export function InfoIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <circle cx="10" cy="10" r="7" {...stroke} />
      <path d="M10 9.5V14M10 6.5V6.51" {...stroke} />
    </svg>
  );
}

export function SparkIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M10 3L11.5 8L16.5 9.5L11.5 11L10 16L8.5 11L3.5 9.5L8.5 8L10 3Z" {...stroke} />
    </svg>
  );
}

export function CopyIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <rect x="6.5" y="6.5" width="9.5" height="10" rx="1.5" {...stroke} />
      <path d="M13.5 6.5V5C13.5 4.17157 12.8284 3.5 12 3.5H5.5C4.67157 3.5 4 4.17157 4 5V12.5C4 13.3284 4.67157 14 5.5 14H6.5" {...stroke} />
    </svg>
  );
}

export function PencilIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M3.5 16.5L7 15.5L16 6.5L13.5 4L4.5 13L3.5 16.5Z" {...stroke} />
      <path d="M11.5 6L14 8.5" {...stroke} />
    </svg>
  );
}

export function AlertIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M10 3.5L17 16H3L10 3.5Z" {...stroke} />
      <path d="M10 9V11.5M10 13.5V13.51" {...stroke} />
    </svg>
  );
}

export function ChevronRightIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M8 5L13 10L8 15" {...stroke} />
    </svg>
  );
}

export function ChevronLeftIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M12 5L7 10L12 15" {...stroke} />
    </svg>
  );
}

export function ToolIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path
        d="M14.5 3.5L16.5 5.5L13.5 8.5L11.5 6.5L14.5 3.5Z M11.5 6.5L4.5 13.5C4 14 4 14.8 4.5 15.3L4.7 15.5C5.2 16 6 16 6.5 15.5L13.5 8.5"
        {...stroke}
      />
    </svg>
  );
}

export function CelebrateIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M3 17L7 6L14 13L3 17Z" {...stroke} />
      <path d="M11 4.5L12 5.5M14 3L14 4.5M16 5.5L17 5.5M14.5 7.5L16 8" {...stroke} />
    </svg>
  );
}

export function HelpIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <circle cx="10" cy="10" r="7" {...stroke} />
      <path d="M8 8C8 6.89543 8.89543 6 10 6C11.1046 6 12 6.89543 12 8C12 8.7 11.6 9.3 11 9.6C10.4 9.9 10 10.4 10 11M10 13.5V13.51" {...stroke} />
    </svg>
  );
}

export function LogoutIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M8 3H4.5C3.94772 3 3.5 3.44772 3.5 4V16C3.5 16.5523 3.94772 17 4.5 17H8M13 14L17 10L13 6M17 10H8" {...stroke} />
    </svg>
  );
}
