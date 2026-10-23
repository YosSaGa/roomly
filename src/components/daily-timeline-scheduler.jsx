// Adapted from the authenticated 21st.dev source stored in vendor/21st.
// Retains hourly timeSlots, eventsAtTime grouping, and add/delete actions.
// Parent owns reservations; room conflict validation stays in BookingModal.
import React from 'react';
import {Plus,Trash2,Users,Clock} from 'lucide-react';
export default function DailyTimelineScheduler({date,events,rooms,onAdd,onDelete,startHour=8,endHour=17}){
 const timeSlots=[];
 for(let hour=startHour;hour<=endHour;hour++)timeSlots.push({hour,minute:0});
 return <section className="daily-timeline"><div className="timeline-title"><div><Clock size={17}/><h2>นัดหมายของฉัน</h2></div><span>{events.length} รายการ</span></div><div className="timeline-scroll">{timeSlots.map(({hour,minute})=>{const timeLabel=String(hour).padStart(2,'0')+':00';const eventsAtTime=events.filter(e=>Number(e.start.slice(0,2))===hour);const past=new Date(date+'T'+timeLabel)<new Date();return <div key={hour} className="timeline-hour"><span className="timeline-label">{timeLabel}</span><div className="timeline-line"><div className="timeline-hour-header"><span>{eventsAtTime.length?'มีนัดหมาย':'ไม่มีนัดหมาย'}</span><button disabled={past} className="secondary" onClick={()=>onAdd(timeLabel)}><Plus size={13}/>จองช่วงนี้</button></div>{eventsAtTime.map(event=><div className="timeline-event" key={event.id}><i className={'room-dot color-'+event.room}/><div><b>{event.title}</b><p>{event.start}–{event.end} · {rooms.find(r=>r.id===event.room)?.name}</p><small><Users size={11}/>{event.people} คน · {event.name}</small></div><button aria-label={`ยกเลิก ${event.title}`} className="icon-button" onClick={()=>onDelete(event.id)}><Trash2 size={15}/></button></div>)}</div></div>;})}</div><p className="scheduler-credit">Daily Timeline Scheduler by <a href="https://21st.dev/@ruixen.ui/components/daily-timeline-scheduler" target="_blank" rel="noreferrer">Ruixen UI ↗</a></p></section>;
}
