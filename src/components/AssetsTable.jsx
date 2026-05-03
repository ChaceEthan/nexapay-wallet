import { useState } from "react";

export default function AssetsTable({ assets }) {
  const [search, setSearch] = useState("");

  const filtered = (Array.isArray(assets) ? assets : []).filter((a) =>
    a?.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#1e2329] p-6 rounded-xl">
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-2 w-full bg-[#0b0e11]"
      />

      {filtered.length === 0 ? (
        <p>No assets</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Balance</th>
              <th>USD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i}>
                <td>{a.symbol}</td>
                <td>{a.balance}</td>
                <td>${a.usdValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}