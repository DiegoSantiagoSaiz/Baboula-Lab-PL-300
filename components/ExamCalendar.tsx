import React from 'react';
import { Calendar, MapPin, Globe } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'regional' | 'local';
}

interface HolidayList {
  [key: string]: {
    name: string;
    holidays: Holiday[];
  };
}

const HOLIDAY_DATA: HolidayList = {
  asturias: {
    name: 'Asturias, Spain',
    holidays: [
      { date: '2026-01-01', name: "New Year's Day", type: 'national' },
      { date: '2026-01-06', name: "Epiphany", type: 'national' },
      { date: '2026-04-02', name: "Maundy Thursday", type: 'national' },
      { date: '2026-04-03', name: "Good Friday", type: 'national' },
      { date: '2026-05-01', name: "Labour Day", type: 'national' },
      { date: '2026-08-15', name: "Assumption Day", type: 'national' },
      { date: '2026-09-08', name: "Asturias Day", type: 'regional' },
      { date: '2026-10-12', name: "Spanish National Day", type: 'national' },
      { date: '2026-11-01', name: "All Saints' Day", type: 'national' },
      { date: '2026-12-06', name: "Constitution Day", type: 'national' },
      { date: '2026-12-08', name: "Immaculate Conception", type: 'national' },
      { date: '2026-12-25', name: "Christmas Day", type: 'national' },
    ]
  },
  madrid: {
    name: 'Madrid, Spain',
    holidays: [
      { date: '2026-01-01', name: "New Year's Day", type: 'national' },
      { date: '2026-01-06', name: "Epiphany", type: 'national' },
      { date: '2026-03-20', name: "San José", type: 'regional' },
      { date: '2026-04-02', name: "Maundy Thursday", type: 'national' },
      { date: '2026-04-03', name: "Good Friday", type: 'national' },
      { date: '2026-05-01', name: "Labour Day", type: 'national' },
      { date: '2026-05-02', name: "Dos de Mayo", type: 'regional' },
      { date: '2026-05-15', name: "San Isidro", type: 'local' },
      { date: '2026-08-15', name: "Assumption Day", type: 'national' },
      { date: '2026-10-12', name: "Spanish National Day", type: 'national' },
      { date: '2026-11-01', name: "All Saints' Day", type: 'national' },
      { date: '2026-11-09', name: "Almudena", type: 'local' },
      { date: '2026-12-06', name: "Constitution Day", type: 'national' },
      { date: '2026-12-08', name: "Immaculate Conception", type: 'national' },
      { date: '2026-12-25', name: "Christmas Day", type: 'national' },
    ]
  },
  spain_national: {
    name: 'Spain (National Only)',
    holidays: [
      { date: '2026-01-01', name: "New Year's Day", type: 'national' },
      { date: '2026-01-06', name: "Epiphany", type: 'national' },
      { date: '2026-04-03', name: "Good Friday", type: 'national' },
      { date: '2026-05-01', name: "Labour Day", type: 'national' },
      { date: '2026-08-15', name: "Assumption Day", type: 'national' },
      { date: '2026-10-12', name: "Spanish National Day", type: 'national' },
      { date: '2026-11-01', name: "All Saints' Day", type: 'national' },
      { date: '2026-12-06', name: "Constitution Day", type: 'national' },
      { date: '2026-12-08', name: "Immaculate Conception", type: 'national' },
      { date: '2026-12-25', name: "Christmas Day", type: 'national' },
    ]
  },
  global: {
    name: 'Global / Generic',
    holidays: [
      { date: '2026-01-01', name: "New Year's Day", type: 'national' },
      { date: '2026-05-01', name: "International Workers' Day", type: 'national' },
      { date: '2026-12-25', name: "Christmas Day", type: 'national' },
      { date: '2026-12-31', name: "New Year's Eve", type: 'national' },
    ]
  }
};

interface ExamCalendarProps {
  currentRegion?: string;
  onRegionChange?: (region: string) => void;
}

export const ExamCalendar: React.FC<ExamCalendarProps> = ({ currentRegion = 'asturias', onRegionChange }) => {
  const { language, t } = useLanguage();
  const today = new Date();
  const selectedRegionData = HOLIDAY_DATA[currentRegion] || HOLIDAY_DATA.global;
  
  const upcomingHolidays = selectedRegionData.holidays
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const getRegionName = (key: string) => {
    if (language === 'es') {
      switch(key) {
        case 'asturias': return 'Asturias, España';
        case 'madrid': return 'Madrid, España';
        case 'spain_national': return 'España (Solo Nacional)';
        case 'global': return 'Global / Genérico';
        default: return key;
      }
    } else {
      switch(key) {
        case 'asturias': return 'Asturias, Spain';
        case 'madrid': return 'Madrid, Spain';
        case 'spain_national': return 'Spain (National Only)';
        case 'global': return 'Global / Generic';
        default: return key;
      }
    }
  };

  const getHolidayName = (name: string) => {
    if (language === 'es') {
      switch(name) {
        case "New Year's Day": return "Año Nuevo";
        case "Epiphany": return "Epifanía";
        case "Maundy Thursday": return "Jueves Santo";
        case "Good Friday": return "Viernes Santo";
        case "Labour Day": return "Día del Trabajo";
        case "International Workers' Day": return "Día Internacional de los Trabajadores";
        case "Assumption Day": return "Día de la Asunción";
        case "Asturias Day": return "Día de Asturias";
        case "Spanish National Day": return "Fiesta Nacional de España";
        case "All Saints' Day": return "Día de Todos los Santos";
        case "Constitution Day": return "Día de la Constitución";
        case "Immaculate Conception": return "Inmaculada Concepción";
        case "Christmas Day": return "Navidad";
        case "San José": return "San José";
        case "Dos de Mayo": return "Dos de Mayo";
        case "San Isidro": return "San Isidro";
        case "Almudena": return "Almudena";
        case "New Year's Eve": return "Nochevieja";
        default: return name;
      }
    }
    return name;
  };

  const getTypeStyles = (type: string) => {
    switch(type) {
      case 'national': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'regional': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'local': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return t('holiday_today');
    if (diff === 1) return t('holiday_tomorrow');
    if (diff < 7) return t('holiday_days', { diff });
    
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-lg border border-border animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">{t('calendar_title')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {currentRegion === 'global' ? <Globe className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
          <select 
            value={currentRegion}
            onChange={(e) => onRegionChange?.(e.target.value)}
            className="text-xs font-bold bg-background border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
          >
            {Object.keys(HOLIDAY_DATA).map(key => (
              <option key={key} value={key}>{getRegionName(key)}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-3">
        {upcomingHolidays.length > 0 ? (
          upcomingHolidays.map((holiday, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border group hover:border-primary transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                  {getDayLabel(holiday.date)}
                </span>
                <span className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{getHolidayName(holiday.name)}</span>
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-widest ${getTypeStyles(holiday.type)}`}>
                {holiday.type === 'national' ? t('holiday_national') : holiday.type === 'regional' ? t('holiday_regional') : t('holiday_local')}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4">{t('holiday_none')}</p>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t('holiday_national')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t('holiday_regional')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t('holiday_local')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
