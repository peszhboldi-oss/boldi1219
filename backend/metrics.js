'use strict';
// Date-only calendar arithmetic uses UTC to avoid DST changing a calendar day.
function shift(date, days) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function monday(date) { const n = new Date(date + 'T12:00:00Z').getUTCDay(); return shift(date, -(n === 0 ? 6 : n - 1)); }
function today(timeZone = 'Europe/Budapest', now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
function streak({ startDate, today: end, foodDates = [], workoutDates = [], restDates = [], closedDates = [], previousLongest = 0 }) {
  const foods = new Set(foodDates), activity = new Set([...workoutDates, ...restDates]), closed = new Set(closedDates);
  let current = 0, longest = previousLongest, misses = 0, week = null, weekly = 0;
  for (let day = startDate; day <= end; day = shift(day, 1)) {
    const w = monday(day); if (w !== week) { week = w; misses = 0; }
    if (foods.has(day) && activity.has(day)) { current++; longest = Math.max(longest, current); if (w === monday(end)) weekly++; }
    else if (day !== end || closed.has(day)) { misses++; if (misses >= 2) current = 0; }
  }
  return { current, longest, weekly };
}
function stats(workouts, sets, from, to) {
  const selected = workouts.filter(w => w.status !== 'archived' && w.date >= from && w.date <= to);
  const dates = new Map(selected.map(w => [w.id, w.date]));
  const actual = sets.filter(s => dates.has(s.workout_id) && s.completed);
  const hard = actual.filter(s => !s.warmup && s.actual_weight != null && s.actual_reps != null && s.category !== 'cardio');
  const weighted = actual.filter(s => ['free_weight','machine'].includes(s.category) && s.actual_weight != null && s.actual_reps != null);
  const rpes = actual.filter(s => s.rpe != null);
  const muscle = {}; for (const s of hard) muscle[s.muscle] = (muscle[s.muscle] || 0) + 1;
  const series = selected.map(w => {
    const ws = actual.filter(s => s.workout_id === w.id);
    const volume = ws.filter(s => ['free_weight','machine'].includes(s.category) && s.actual_weight != null && s.actual_reps != null);
    const rpe = ws.filter(s => s.rpe != null);
    return { id:w.id,date:w.date,name:w.name,volume:volume.length ? volume.reduce((n,s) => n+s.actual_weight*s.actual_reps,0) : null,rpe:rpe.length ? rpe.reduce((n,s) => n+s.rpe,0)/rpe.length : null };
  }).sort((a,b) => a.date.localeCompare(b.date));
  const performance = {};
  for (const s of actual) {
    const key = s.exercise_id;
    if (!performance[key]) performance[key] = { name:s.exercise_name,category:s.category,points:[] };
    performance[key].points.push({ date:dates.get(s.workout_id),weight:s.actual_weight,reps:s.actual_reps,rpe:s.rpe,duration:s.duration_minutes,distance:s.distance_km });
  }
  for (const p of Object.values(performance)) p.points.sort((a,b) => a.date.localeCompare(b.date));
  return { completedWorkouts:selected.filter(w => w.status === 'completed').length,hardSets:hard.length,muscle,volume:weighted.length ? weighted.reduce((n,s) => n+s.actual_weight*s.actual_reps,0) : null,averageRpe:rpes.length ? rpes.reduce((n,s) => n+s.rpe,0)/rpes.length : null,bodyweightSets:hard.filter(s => s.category === 'bodyweight').length,cardioMinutes:actual.some(s => s.category==='cardio' && s.duration_minutes!=null) ? actual.filter(s => s.category==='cardio').reduce((n,s) => n+(s.duration_minutes || 0),0) : null,series,performance,from,to };
}
module.exports = { shift, monday, today, streak, stats };
