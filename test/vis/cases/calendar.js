import * as d3 from "d3";

// G2's calendar data for its rect-bar and rect-pie facets: three activities per day of June 2022,
// with the random values made repeatable.
export const days = ["Sun.", "Mon.", "Tues.", "Wed.", "Thur.", "Fri.", "Sat."];

export function calendar() {
  const random = d3.randomUniform.source(d3.randomLcg(0.42))();
  const week = (date) => Math.ceil((date.getDate() + new Date(2022, 5, 1).getDay()) / 7);
  return Array.from({length: 30}, (_, i) => {
    const date = new Date(2022, 5, i + 1);
    return ["Eat", "Play", "Sleep"].map((activity) => ({
      activity,
      value: random(),
      week: `${week(date)}`,
      day: days[date.getDay()],
    }));
  }).flat();
}

// The cells of the calendar that have days: one row per (day, week), with its rows of data.
export function cells(data) {
  return d3
    .groups(
      data,
      (d) => d.day,
      (d) => d.week,
    )
    .flatMap(([day, weeks]) => weeks.map(([week, rows]) => ({day, week, rows})));
}
