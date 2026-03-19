export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead>
      <tr className="border-b border-gray-100">
        {children}
      </tr>
    </thead>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>;
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>
      {children}
    </td>
  );
}
