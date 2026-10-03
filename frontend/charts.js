export function nutritionChart(days,key,label,unit,esc,num,dt){
  const points=days.filter(d=>d.actual[key]!=null||d.targets[key]!=null);if(!points.length)return '<div class="chart-empty">Még nincs bevitel vagy célérték.</div>';
  const max=Math.max(1,...points.flatMap(d=>[d.actual[key],d.targets[key]]).filter(v=>v!=null)),w=560,h=200,l=48,r=20,t=20,b=38,x=i=>l+(w-l-r)*(days.length===1?.5:i/(days.length-1)),y=v=>h-b-v/max*(h-t-b);
  const series=(kind,css)=>{
    // Missing values break the line: an unrecorded day is never displayed as zero.
    let segments=[],segment=[];days.forEach((d,i)=>{if(d[kind][key]==null){if(segment.length)segments.push(segment);segment=[];}else segment.push([d,i]);});if(segment.length)segments.push(segment);
    return segments.map(s=>`<polyline class="${css}" points="${s.map(([d,i])=>`${x(i)},${y(d[kind][key])}`).join(' ')}"/>${s.map(([d,i])=>`<circle class="${css}" cx="${x(i)}" cy="${y(d[kind][key])}" r="3"><title>${dt(d.date)} · ${kind==='actual'?'Tény':'Cél'}: ${num(d[kind][key])} ${unit}</title></circle>`).join('')}`).join('');
  };
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)} — tényleges bevitel és cél"><line class="axis" x1="${l}" y1="${h-b}" x2="${w-r}" y2="${h-b}"/><text x="0" y="20">${num(max)}</text><text x="0" y="${h-b}">0</text>${series('targets','target-line')}${series('actual','line')}<text x="${l}" y="${h-10}">${dt(days[0].date)}</text><text text-anchor="end" x="${w-r}" y="${h-10}">${dt(days.at(-1).date)}</text></svg><p class="help"><span class="chart-actual">● Tényleges</span> · <span class="chart-target">┄ Célérték</span> · ${unit}</p>`;
}
