import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntegrationService } from '../../core/services/integration.service';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  meeting_url?: string;
  html_link?: string;
  provider: 'google' | 'microsoft';
}

interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  date: Date;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Calendar</h1>
          <p class="subtitle">Meetings and events from connected accounts</p>
        </div>
        <div class="header-actions">
          <button (click)="loadEvents()" class="btn-secondary" [class.loading]="loading()">
            {{ loading() ? 'Syncing...' : 'Sync Calendar' }}
          </button>
        </div>
      </div>

      <div class="calendar-container">
        <div class="calendar-header">
          <div class="current-month">
            {{ monthNames[currentDate.getMonth()] }} {{ currentDate.getFullYear() }}
          </div>
          <div class="nav-buttons">
            <button (click)="prevMonth()" class="nav-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button (click)="goToToday()" class="nav-btn today-btn">Today</button>
            <button (click)="nextMonth()" class="nav-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div class="calendar-grid">
          <div class="weekday" *ngFor="let day of weekDays">{{ day }}</div>
          
          <div *ngFor="let day of calendarDays()" 
               class="calendar-day" 
               [class.other-month]="!day.isCurrentMonth"
               [class.today]="day.isToday">
            <div class="day-number">{{ day.day }}</div>
            <div class="events-container">
              <div *ngFor="let event of day.events" 
                   class="event-pill" 
                   [class]="'provider-' + event.provider"
                   (click)="openEvent(event)">
                <span class="event-time">{{ event.start | date:'HH:mm' }}</span>
                <span class="event-title">{{ event.title }}</span>
                <span *ngIf="event.meeting_url" class="meeting-icon">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Detail Sidebar/Modal -->
      <div class="event-overlay" *ngIf="selectedEvent()" (click)="selectedEvent.set(null)">
        <div class="event-card" (click)="$event.stopPropagation()">
            <div class="event-card-header">
                <span class="provider-tag" [class]="'provider-' + selectedEvent()?.provider">
                    {{ selectedEvent()?.provider | titlecase }}
                </span>
                <button (click)="selectedEvent.set(null)" class="close-btn">&times;</button>
            </div>
            <h3>{{ selectedEvent()?.title }}</h3>
            <div class="event-info">
                <div class="info-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <span>{{ selectedEvent()?.start | date:'fullDate' }}</span>
                </div>
                <div class="info-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{{ selectedEvent()?.start | date:'shortTime' }} - {{ selectedEvent()?.end | date:'shortTime' }}</span>
                </div>
            </div>
            
            <div class="actions">
                <a *ngIf="selectedEvent()?.meeting_url" 
                   [href]="selectedEvent()?.meeting_url" 
                   target="_blank" 
                   class="btn-primary join-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    Join Meeting
                </a>
                <a *ngIf="selectedEvent()?.html_link" 
                   [href]="selectedEvent()?.html_link" 
                   target="_blank" 
                   class="btn-secondary">
                    View in {{ selectedEvent()?.provider | titlecase }}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                </a>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { font-family:var(--sans); color:var(--text); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    h1 { font-family:var(--mono); font-size:28px; font-weight:700; color:var(--text); margin:0; }
    .subtitle { color:var(--muted); font-size:12px; margin-top:4px; }

    .btn-primary, .btn-secondary {
        padding: 8px 16px;
        border-radius: 9px;
        font-family: var(--sans);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        transition: all 0.2s;
        border: none;
    }
    .btn-primary { background:var(--accent); color:#fff; }
    .btn-primary:hover { background:#ff1f42; transform:translateY(-1px); }
    .btn-secondary { background:var(--surface); color:var(--muted); border:1px solid var(--border); }
    .btn-secondary:hover { border-color:rgba(255,59,92,0.3); color:var(--text); }

    .calendar-container {
        background:var(--surface);
        border:1px solid var(--border);
        border-radius:16px;
        overflow:hidden;
    }

    .calendar-header {
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:20px 24px;
        border-bottom:1px solid var(--border);
    }

    .current-month {
        font-family:var(--mono);
        font-size:18px;
        font-weight:700;
        color:var(--text);
    }

    .nav-buttons { display:flex; gap:8px; }
    .nav-btn {
        background:var(--bg);
        border:1px solid var(--border);
        color:var(--muted);
        width:32px;
        height:32px;
        border-radius:6px;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        transition:all 0.15s;
    }
    .nav-btn:hover { border-color:rgba(255,59,92,0.3); color:var(--text); }
    .today-btn { width:auto; padding:0 12px; font-size:11px; font-weight:600; font-family:var(--sans); }

    .calendar-grid {
        display:grid;
        grid-template-columns:repeat(7, 1fr);
        min-height:600px;
    }

    .weekday {
        padding:12px;
        text-align:center;
        font-size:10px;
        font-weight:700;
        color:var(--muted);
        text-transform:uppercase;
        letter-spacing:1px;
        border-bottom:1px solid var(--border);
        font-family:var(--mono);
        opacity:0.6;
    }

    .calendar-day {
        min-height:120px;
        padding:8px;
        border-right:1px solid var(--border);
        border-bottom:1px solid var(--border);
        display:flex;
        flex-direction:column;
        gap:4px;
    }
    .calendar-day:nth-child(7n) { border-right:none; }
    .calendar-day.other-month { background:var(--bg); opacity:0.4; }
    .calendar-day.today { background:var(--accent-dim); }
    .calendar-day.today .day-number { color:var(--accent); font-weight:700; }

    .day-number {
        font-size:11px;
        color:var(--muted);
        padding:4px;
        font-family:var(--mono);
    }

    .events-container {
        display:flex;
        flex-direction:column;
        gap:3px;
        overflow-y:auto;
    }

    .event-pill {
        font-size:10px;
        padding:4px 8px;
        border-radius:4px;
        cursor:pointer;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        display:flex;
        align-items:center;
        gap:6px;
        transition:filter 0.2s;
    }
    .event-pill:hover { filter:brightness(1.2); }
    .event-time { font-weight:700; opacity:0.8; font-family:var(--mono); }
    .meeting-icon { margin-left:auto; display:flex; align-items:center; }

    .provider-google { background:rgba(66,133,244,0.2); color:#4285f4; border-left:2px solid #4285f4; }
    .provider-microsoft { background:rgba(5,166,240,0.2); color:#05a6f0; border-left:2px solid #05a6f0; }

    .event-overlay {
        position:fixed;
        top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.7);
        backdrop-filter:blur(4px);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:1000;
    }

    .event-card {
        background:var(--surface);
        border:1px solid var(--border);
        border-radius:16px;
        padding:32px;
        width:100%;
        max-width:400px;
        box-shadow:0 20px 40px rgba(0,0,0,0.4);
    }

    .event-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .provider-tag { font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; font-family:var(--mono); }
    .provider-tag.provider-google { background:#4285f4; color:white; border-left:none; }
    .provider-tag.provider-microsoft { background:#05a6f0; color:white; border-left:none; }
    .close-btn { background:none; border:none; color:var(--muted); font-size:24px; cursor:pointer; transition:color 0.15s; }
    .close-btn:hover { color:var(--accent); }

    .event-card h3 { font-family:var(--mono); font-size:18px; margin:0 0 16px 0; color:var(--text); }

    .event-info { display:flex; flex-direction:column; gap:12px; margin-bottom:32px; }
    .info-item { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--muted); }

    .actions { display:flex; flex-direction:column; gap:12px; }
    .join-btn { justify-content:center; padding:12px; font-size:12px; }
  `],
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  calendarDays = signal<CalendarDay[]>([]);
  events = signal<CalendarEvent[]>([]);
  loading = signal(false);
  selectedEvent = signal<CalendarEvent | null>(null);

  monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  constructor(private integrationService: IntegrationService) { }

  ngOnInit() {
    this.generateCalendar();
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.integrationService.getCalendarEvents().subscribe({
      next: (res) => {
        this.events.set(res.events);
        this.generateCalendar();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  generateCalendar() {
    const days: CalendarDay[] = [];
    const date = new Date(this.currentDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfMonth = new Date(year, month, lastDateOfMonth).getDay();
    const lastDateOfLastMonth = new Date(year, month, 0).getDate();

    const today = new Date();

    // Previous month days
    for (let i = firstDayOfMonth; i > 0; i--) {
      const d = new Date(year, month - 1, lastDateOfLastMonth - i + 1);
      days.push({
        day: lastDateOfLastMonth - i + 1,
        month: month - 1,
        year: year,
        isCurrentMonth: false,
        date: d,
        isToday: this.isSameDay(d, today),
        events: this.getEventsForDay(d)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDateOfMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        date: d,
        isToday: this.isSameDay(d, today),
        events: this.getEventsForDay(d)
      });
    }

    // Next month days
    const totalDays = days.length;
    const remainingDays = 42 - totalDays; // 6 weeks
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        day: i,
        month: month + 1,
        year: year,
        isCurrentMonth: false,
        date: d,
        isToday: this.isSameDay(d, today),
        events: this.getEventsForDay(d)
      });
    }
    this.calendarDays.set(days);
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events().filter(event => {
      const eventDate = new Date(event.start);

      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
  isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  openEvent(event: CalendarEvent) {
    this.selectedEvent.set(event);
  }
}
