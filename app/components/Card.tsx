import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Card({ children, className = "", style, title, subtitle, action }: CardProps) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: "#0f1623",
        border: "1px solid #1e2d3d",
        ...style,
      }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid #1e2d3d" }}
        >
          <div>
            <div
              className="text-xs uppercase tracking-widest font-600"
              style={{ color: "#94a3b8" }}
            >
              {title}
            </div>
            {subtitle && (
              <div className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
                {subtitle}
              </div>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
