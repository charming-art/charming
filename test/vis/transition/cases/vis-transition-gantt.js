import * as cm from "../../../../src/index.js";
import {intro} from "./intro.js";

// Canis's Gantt chart (https://canisjs.github.io/canis-editor/index.html?exmp=gantt_1): the tasks of
// an event plan, each bar wiping in from the left at its start time and lasting its duration, at
// 600ms per unit, by the time scale that enterDelay and enterDuration share. With linear easing,
// the bars' edges sweep across together, like the hand of a timeline. The labels wipe in with their
// bars, for 300ms.
export function visTransitionGantt() {
  const tasks = [
    {event: "event planning", start: 1, end: 4},
    {event: "layout logistics", start: 3, end: 13},
    {event: "select vendors", start: 5, end: 8},
    {event: "hire venue", start: 9, end: 13},
    {event: "hire caterer", start: 10, end: 14},
    {event: "hire event decorators", start: 12, end: 17},
    {event: "rehearsal", start: 14, end: 16},
    {event: "event celebration", start: 17, end: 18},
  ].map((d) => ({...d, duration: d.end - d.start}));
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: {ease: "linear"}}).renderer(renderer);
  const draw = () => {
    root
      .data(tasks)
      .transform(cm.encode, {x: "start", x1: "end", y: "event", enterDelay: "start", enterDuration: "duration"})
      .transform(cm.spreadY, {sort: false})
      .transform(cm.plane, {
        marginRight: 120,
        x: {domain: [0, 18], label: null},
        y: {axis: null},
        time: {domain: [0, 1], range: [0, 600]},
      })
      .add(cm.rect, {fill: "steelblue", appear: true, enter: {clipRight: 1}})
      .add(cm.label, {
        position: "right",
        text: (d) => d.datum.event,
        fill: "#333",
        fontSize: 12,
        padding: 6,
        appear: true,
        enter: {clipRight: 1, duration: 300},
      });
  };
  return intro(renderer.node(), root, draw, 2500);
}
