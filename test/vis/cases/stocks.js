import * as d3 from "d3";

// The stocks of Plot's labeled multi-line chart: four CSV files merged into one table, with the
// symbol of each stock as its first column.
export async function stocks() {
  const symbols = ["AAPL", "AMZN", "GOOG", "IBM"];
  const tables = await Promise.all(symbols.map((symbol) => d3.csv(`data/${symbol.toLowerCase()}.csv`, d3.autoType)));
  return symbols.flatMap((Symbol, i) => tables[i].map((d) => ({Symbol, ...d})));
}
