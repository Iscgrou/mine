import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className={cn("w-full min-w-full divide-y divide-gray-200", className)}>
          {children}
        </table>
      </div>
    </div>
  );
}

interface ResponsiveTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  return (
    <thead className={cn("bg-gray-50", className)}>
      {children}
    </thead>
  );
}

interface ResponsiveTableBodyProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableBody({ children, className }: ResponsiveTableBodyProps) {
  return (
    <tbody className={cn("bg-white divide-y divide-gray-200", className)}>
      {children}
    </tbody>
  );
}

interface ResponsiveTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ResponsiveTableRow({ children, className, onClick }: ResponsiveTableRowProps) {
  return (
    <tr 
      className={cn(
        "hover:bg-gray-50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface ResponsiveTableCellProps {
  children: ReactNode;
  className?: string;
  isHeader?: boolean;
}

export function ResponsiveTableCell({ children, className, isHeader = false }: ResponsiveTableCellProps) {
  const Component = isHeader ? "th" : "td";
  
  return (
    <Component 
      className={cn(
        "px-6 py-4 text-sm",
        isHeader 
          ? "font-medium text-gray-900 text-right" 
          : "text-gray-500 text-right",
        "whitespace-nowrap",
        className
      )}
    >
      {children}
    </Component>
  );
}

// Mobile-friendly card view for tables on small screens
interface MobileTableCardProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableCard({ children, className }: MobileTableCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3",
      "block md:hidden", // Only show on mobile
      className
    )}>
      {children}
    </div>
  );
}

interface MobileTableFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileTableField({ label, value, className }: MobileTableFieldProps) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}