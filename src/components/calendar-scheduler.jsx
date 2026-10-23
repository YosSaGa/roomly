// Adapted from Ruixen UI's Calendar Scheduler, unlocked on 21st.dev on 2026-10-23.
// Keeps its Calendar + two-column time-slot layout and reset action.
// Changed to controlled state, Thai locale, and real room availability.
import React from 'react';
import {DayPicker} from 'react-day-picker';
import {th} from 'date-fns/locale';
import {CalendarDays, Clock} from 'lucide-react';
import {minutes} from '../booking';
import 'react-day-picker/style.css';

const keyOf=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function CalendarScheduler({value,onChange,roomId,bookings}){
 const selected=value.date?new Date(value.date+'T12:00'):undefined;
 const today=new Date();today.setHours(0,0,0,0);
 const slots=Array.from({length:10},(_,i)=>`${String(i+8).padStart(2,'0')}:00`);
 return <section className="ruixen-scheduler" aria-label="เลือกวันและเวลาประชุม"><div className="scheduler-heading"><CalendarDays size={16}/><h3>เลือกวันและเวลา</h3><span>60 นาที / ช่วง</span></div><div className="scheduler-content"><div className="scheduler-calendar"><DayPicker mode="single" selected={selected} defaultMonth={selected} locale={th} weekStartsOn={1} showOutsideDays disabled={{before:today}} onSelect={date=>date&&onChange({...value,date:keyOf(date),start:'',end:''})}/></div><div className="scheduler-times"><p><Clock size={13}/>เวลาเริ่มต้น</p><div className="scheduler-slots">{slots.map(slot=>{const end=String(Number(slot.slice(0,2))+1).padStart(2,'0')+':00';const taken=!value.date||new Date(`${value.date}T${slot}`)<new Date()||bookings.some(b=>b.room===roomId&&b.date===value.date&&minutes(slot)<minutes(b.end)&&minutes(end)>minutes(b.start));return <button type="button" key={slot} disabled={taken} aria-pressed={value.start===slot&&value.end===end} onClick={()=>onChange({...value,start:slot,end})}>{slot}</button>;})}</div></div></div><div className="scheduler-footer"><button type="button" onClick={()=>onChange({...value,date:keyOf(today),start:'',end:''})}>ล้างเวลา</button><span>{value.start&&value.end?`${value.start} – ${value.end} น.`:'เลือกเวลาที่ว่างด้านบน'}</span></div><div className="scheduler-credit">Calendar Scheduler by <a href="https://21st.dev/@ruixen.ui/components/calendar-scheduler" target="_blank" rel="noreferrer">Ruixen UI ↗</a></div></section>;
}
